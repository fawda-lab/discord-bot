const {
    Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder, PermissionFlagsBits,
} = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const GIFEncoder = require('gif-encoder-2');
const fs   = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────
const TOKEN      = require('./config.json').token;
const PREFIX     = '=';
const DATA_FILE  = path.join(__dirname, 'rank_data.json');
const GUILD_ID   = '1480956937058390056';
const OWNER_ID   = '1430652121375838254';
const STAFF_ROLE = '1487864597795966976';

// ─── XP Config ────────────────────────────────────────────────────────────────
const MSG_XP_MIN   = 15;
const MSG_XP_MAX   = 25;
const MSG_COOLDOWN = 60_000;   // 1 minute cooldown between message XP
const VOICE_XP     = 10;      // XP per minute in voice

// ─── Rank milestones ──────────────────────────────────────────────────────────
const RANKS = [
    { level: 10,  id: '1487864709129568479', name: '»Bronze'       },
    { level: 20,  id: '1487864708336975872', name: '»Epic'         },
    { level: 30,  id: '1487864707560902766', name: '»Celestia'     },
    { level: 40,  id: '1487864706822836254', name: '»Elite'        },
    { level: 50,  id: '1487864706034171954', name: '»Cosmic'       },
    { level: 60,  id: '1487864705232928999', name: '»Master'       },
    { level: 70,  id: '1487864695216934963', name: '»Grand Master' },
    { level: 80,  id: '1487864694256570493', name: '»Champion'     },
    { level: 90,  id: '1487864693493075988', name: '»Hero'         },
    { level: 100, id: '1487864692687765596', name: '»Royal'        },
];

// ─── Data ─────────────────────────────────────────────────────────────────────
function loadData() {
    if (!fs.existsSync(DATA_FILE)) return { users: {} };
    try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
    catch { return { users: {} }; }
}
function saveData(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2), 'utf8'); }

function getMainBotData() {
    try {
        const p = path.join(__dirname, '..', 'fawda main bot', 'data.json');
        if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch {}
    return null;
}

// ─── XP / Level formula ───────────────────────────────────────────────────────
// XP needed to advance from level n to n+1 = 200 * (n + 1)
// Total XP to reach level N = 200 * N*(N+1)/2 = 100 * N*(N+1)
function xpToNextLevel(n) { return 200 * (n + 1); }

function calcLevel(totalXP) {
    if (totalXP < 0) totalXP = 0;
    let level = 0, spent = 0;
    while (true) {
        const needed = xpToNextLevel(level);
        if (spent + needed > totalXP) return { level, currentXP: totalXP - spent, neededXP: needed, totalXP };
        spent += needed;
        level++;
    }
}

function getRankName(level) {
    const r = [...RANKS].reverse().find(r => level >= r.level);
    return r ? r.name : 'Initiate';
}

// ─── XP system ────────────────────────────────────────────────────────────────
async function addXP(userId, amount, guild) {
    const data = loadData();
    if (!data.users[userId]) data.users[userId] = { xp: 0, lastMsg: 0 };
    const oldLevel = calcLevel(data.users[userId].xp).level;
    data.users[userId].xp += amount;
    const newInfo   = calcLevel(data.users[userId].xp);
    saveData(data);
    if (newInfo.level > oldLevel) await handleRankUp(userId, oldLevel, newInfo.level, guild);
}

async function handleRankUp(userId, oldLevel, newLevel, guild) {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return;

    let milestone = null;
    for (const rank of RANKS) {
        if (newLevel >= rank.level && oldLevel < rank.level) milestone = rank;
    }
    if (!milestone) return;

    // Remove all rank roles, apply new highest one
    for (const rank of RANKS) {
        if (member.roles.cache.has(rank.id))
            await member.roles.remove(rank.id).catch(() => {});
    }
    const role = guild.roles.cache.get(milestone.id);
    if (role) await member.roles.add(role).catch(() => {});

    await member.send(
        `🎉 You reached **Level ${newLevel}** in **FAWDA**!\n` +
        `You unlocked the rank **${milestone.name}**! Congrats!`
    ).catch(() => {});
}

// ─── Voice session tracking ───────────────────────────────────────────────────
const voiceSessions = new Map(); // userId → joinTimestamp

// ─── Rank color palette ───────────────────────────────────────────────────────
function getRankColors(level) {
    if (level >= 100) return { P: '#D8B4FE', D: '#6B21A8', BAR0: '#3B0764', BAR1: '#D8B4FE', BAR2: '#A855F7' }; // Royal   — purple
    if (level >= 90)  return { P: '#BAE6FD', D: '#1E40AF', BAR0: '#0C2561', BAR1: '#BAE6FD', BAR2: '#60A5FA' }; // Hero    — silver blue
    if (level >= 80)  return { P: '#6EE7B7', D: '#065F46', BAR0: '#022C22', BAR1: '#6EE7B7', BAR2: '#10B981' }; // Champion— emerald
    if (level >= 70)  return { P: '#FDBA74', D: '#92400E', BAR0: '#431407', BAR1: '#FDBA74', BAR2: '#F97316' }; // GrandM  — orange
    if (level >= 60)  return { P: '#FCA5A5', D: '#7F1D1D', BAR0: '#450A0A', BAR1: '#FCA5A5', BAR2: '#EF4444' }; // Master  — red
    if (level >= 50)  return { P: '#93C5FD', D: '#1E3A5F', BAR0: '#0A1628', BAR1: '#93C5FD', BAR2: '#3B82F6' }; // Cosmic  — deep blue
    if (level >= 40)  return { P: '#FCD34D', D: '#78350F', BAR0: '#2D1500', BAR1: '#FCD34D', BAR2: '#F59E0B' }; // Elite   — amber
    if (level >= 30)  return { P: '#7DD3FC', D: '#0C4A6E', BAR0: '#062030', BAR1: '#7DD3FC', BAR2: '#0EA5E9' }; // Celestia— sky blue
    if (level >= 20)  return { P: '#C084FC', D: '#581C87', BAR0: '#1E0533', BAR1: '#C084FC', BAR2: '#A855F7' }; // Epic    — purple
    if (level >= 10)  return { P: '#D97706', D: '#6B3A1F', BAR0: '#2A1200', BAR1: '#D97706', BAR2: '#B45309' }; // Bronze  — bronze
    return                   { P: '#94A3B8', D: '#334155', BAR0: '#0F172A', BAR1: '#94A3B8', BAR2: '#64748B' }; // Initiate— slate
}

// ─── Card helpers ─────────────────────────────────────────────────────────────
function getTopRoleName(member) {
    const priority = [
        { id: '1487864551226478674', name: 'OWNER'        },
        { id: '1487864552275312722', name: 'FOUNDER'      },
        { id: '1487864577134952601', name: 'ADMINISTRATOR'},
        { id: '1487864579596877874', name: 'HEAD MOD'     },
        { id: '1487864597795966976', name: 'STAFF TEAM'   },
        { id: '1487864605660151849', name: 'VERIFICATION' },
    ];
    for (const { id, name } of priority) {
        if (member.roles.cache.has(id)) return name;
    }
    const topRank = [...RANKS].reverse().find(r => member.roles.cache.has(r.id));
    if (topRank) return topRank.name.toUpperCase();
    return 'MEMBER';
}

function getClearance(level) {
    if (level >= 100) return 'OMEGA — UNRESTRICTED';
    if (level >= 90)  return 'OMEGA LEVEL 4';
    if (level >= 80)  return 'OMEGA LEVEL 3';
    if (level >= 70)  return 'OMEGA LEVEL 2';
    if (level >= 60)  return 'OMEGA LEVEL 1';
    if (level >= 50)  return 'SIGMA — TOP SECRET';
    if (level >= 40)  return 'ALPHA — SECRET';
    if (level >= 30)  return 'BETA — CLASSIFIED';
    if (level >= 20)  return 'GAMMA — RESTRICTED';
    if (level >= 10)  return 'DELTA — RESTRICTED';
    return 'NONE — INITIATE';
}

function getMentalState(warns) {
    if (warns >= 3) return 'CRITICAL';
    if (warns === 2) return 'VOLATILE';
    if (warns === 1) return 'UNSTABLE';
    return 'STABLE';
}

function drawCornerBrackets(ctx, x, y, w, h, size, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    const corners = [
        [[x, y + size], [x, y], [x + size, y]],
        [[x + w - size, y], [x + w, y], [x + w, y + size]],
        [[x, y + h - size], [x, y + h], [x + size, y + h]],
        [[x + w - size, y + h], [x + w, y + h], [x + w, y + h - size]],
    ];
    for (const pts of corners) {
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        ctx.lineTo(pts[1][0], pts[1][1]);
        ctx.lineTo(pts[2][0], pts[2][1]);
        ctx.stroke();
    }
}

function drawOrbit(ctx, cx, cy, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.8;
    for (const angle of [0, Math.PI / 3, -Math.PI / 3]) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, 18, 8, angle, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
}

function drawWormSquare(ctx, x, y, w, h, color, wavePhase) {
    const perim = 2 * (w + h);

    // Ghost trail — dim solid border always visible
    ctx.strokeStyle = color + '33';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
    ctx.strokeRect(x, y, w, h);

    // Worms: multiple short dashes marching around the rectangle
    const dashLen = 18, gapLen = 14;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([dashLen, gapLen]);
    ctx.lineDashOffset = -((wavePhase / (Math.PI * 2)) * (dashLen + gapLen) * 4);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;

    // Corner nodes that pulse in brightness
    const pulse = 0.35 + 0.65 * Math.abs(Math.sin(wavePhase));
    ctx.fillStyle = color;
    ctx.globalAlpha = pulse;
    for (const [cx, cy] of [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]) {
        ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// ─── Card generator ───────────────────────────────────────────────────────────
async function generateCard(member, levelInfo, guild, serverRank, warnCount, isOwner) {
    // Pre-load images once, reuse across all frames
    let avatarImg = null, iconImg = null;
    try { avatarImg = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 256 })); } catch {}
    try { const u = guild.iconURL({ extension: 'png', size: 128 }); if (u) iconImg = await loadImage(u); } catch {}

    const FRAMES = 24, DELAY = 55; // ~18fps, 1.3s loop
    const W = 700, H = 870;
    const encoder = new GIFEncoder(W, H, 'octree', true);
    encoder.setDelay(DELAY);
    encoder.setRepeat(0);
    encoder.start();

    for (let f = 0; f < FRAMES; f++) {
        const canvas = createCanvas(W, H);
        const ctx    = canvas.getContext('2d');
        const wavePhase = (f / FRAMES) * Math.PI * 2;
        const scanY     = 8 + Math.round((f / FRAMES) * (H - 16));
        const dotBlink  = f % 4 < 2; // blink every 2 frames
        await drawFrame(ctx, member, levelInfo, guild, serverRank, warnCount, isOwner, avatarImg, iconImg, wavePhase, scanY, dotBlink);
        encoder.addFrame(ctx);
    }

    encoder.finish();
    return Buffer.from(encoder.out.getData());
}

async function drawFrame(ctx, member, levelInfo, guild, serverRank, warnCount, isOwner, avatarImg, iconImg, wavePhase, scanY, dotBlink) {
    const W = 700, H = 870;
    const BG    = '#060606';
    const PANEL = '#0d0d0d';

    const lvl         = isOwner ? 9999 : levelInfo.level;
    const { P: GOLD, D: GOLD_DIM, BAR0, BAR1, BAR2 } = getRankColors(lvl);
    const curXP       = isOwner ? Infinity : levelInfo.currentXP;
    const maxXP       = isOwner ? Infinity : levelInfo.neededXP;
    const totXP       = isOwner ? Infinity : levelInfo.totalXP;
    const pct         = isOwner ? 1 : Math.min(1, curXP / maxXP);
    const rankName    = isOwner ? '»Royal' : getRankName(lvl);
    const func_       = getTopRoleName(member);
    const clearance   = isOwner ? 'OMEGA — UNRESTRICTED' : getClearance(lvl);
    const mentalState = isOwner ? 'VOLATILE' : getMentalState(warnCount);
    const joinDate    = member.joinedAt ? member.joinedAt.toISOString().split('T')[0] : '????-??-??';

    // ── Background + scanlines ───────────────────────────────────────────────
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);

    ctx.strokeStyle = GOLD;     ctx.lineWidth = 2;   ctx.strokeRect(8, 8, W - 16, H - 16);
    ctx.strokeStyle = GOLD_DIM; ctx.lineWidth = 0.5; ctx.strokeRect(12, 12, W - 24, H - 24);

    // ── Header ──────────────────────────────────────────────────────────────
    ctx.fillStyle = GOLD; ctx.font = 'bold 13px "Courier New"';
    ctx.fillText('SUBJECT FILE  //  CLASSIFIED', 20, 33);
    ctx.textAlign = 'right'; ctx.font = '12px "Courier New"';
    ctx.fillText(`⬡ ${func_}`, W - 20, 33);
    ctx.textAlign = 'left';
    ctx.strokeStyle = GOLD; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(8, 45); ctx.lineTo(W - 8, 45); ctx.stroke();

    // ── Avatar panel (left, large) ───────────────────────────────────────────
    const avX = 10, avY = 53, avW = 330, avH = 310;
    ctx.fillStyle = '#111111'; ctx.fillRect(avX, avY, avW, avH);
    if (avatarImg) ctx.drawImage(avatarImg, avX, avY, avW, avH);
    drawCornerBrackets(ctx, avX, avY, avW, avH, 20, GOLD);

    // ── Server panel (right) ─────────────────────────────────────────────────
    const rpX = 350, rpY = 53, rpW = W - rpX - 10, rpH = 310;
    ctx.fillStyle = PANEL; ctx.fillRect(rpX, rpY, rpW, rpH);
    ctx.strokeStyle = GOLD_DIM; ctx.lineWidth = 1; ctx.strokeRect(rpX, rpY, rpW, rpH);

    // Server icon centered at top of right panel
    const iconCX = rpX + Math.floor(rpW / 2), iconCY = rpY + 65;
    if (iconImg) {
        ctx.save();
        ctx.beginPath(); ctx.arc(iconCX, iconCY, 45, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(iconImg, iconCX - 45, iconCY - 45, 90, 90);
        ctx.restore();
        ctx.strokeStyle = GOLD; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(iconCX, iconCY, 45, 0, Math.PI * 2); ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = GOLD_DIM; ctx.font = '9px "Courier New"';
    ctx.fillText('[ SERVER NODE ]', iconCX, rpY + 127);
    ctx.fillStyle = GOLD; ctx.font = 'bold 14px "Courier New"';
    ctx.fillText(guild.name.toUpperCase(), iconCX, rpY + 147);
    ctx.textAlign = 'left';

    drawWormSquare(ctx, rpX + 18, rpY + 168, rpW - 36, 90, GOLD_DIM, wavePhase);

    ctx.textAlign = 'center';
    ctx.fillStyle = GOLD_DIM; ctx.font = '9px "Courier New"';
    ctx.fillText(`SERVER RANK  #${serverRank}`, iconCX, rpY + rpH - 12);
    ctx.textAlign = 'left';

    // ── Divider (below panels) ───────────────────────────────────────────────
    ctx.strokeStyle = GOLD; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(8, 373); ctx.lineTo(W - 8, 373); ctx.stroke();

    // ── Info table ──────────────────────────────────────────────────────────
    const tX = 18, tY = 383;
    ctx.strokeStyle = GOLD_DIM; ctx.lineWidth = 1; ctx.strokeRect(tX, tY, 58, 58);
    drawOrbit(ctx, tX + 29, tY + 29, GOLD_DIM);

    const lx = tX + 72, rowH = 28, valX = W - 18;
    const rows = [
        ['NAME',         member.displayName.substring(0, 22).toUpperCase()],
        ['USERNAME',     `@${member.user.username}`.substring(0, 22)      ],
        ['FUNCTION',     func_                                              ],
        ['INCEPT DATE',  joinDate                                           ],
        ['MENTAL STATE', mentalState                                        ],
        ['CLEARANCE',    clearance                                          ],
    ];
    rows.forEach(([label, value], i) => {
        const ry = tY + 20 + i * rowH;
        ctx.fillStyle = GOLD_DIM; ctx.font = '11px "Courier New"';
        ctx.textAlign = 'left';
        ctx.fillText(label, lx, ry);
        const lw = ctx.measureText(label).width;
        ctx.strokeStyle = GOLD_DIM; ctx.setLineDash([2, 4]); ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(lx + lw + 6, ry - 4); ctx.lineTo(valX - 182, ry - 4); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = GOLD; ctx.font = 'bold 11px "Courier New"';
        ctx.textAlign = 'right';
        ctx.fillText(value.substring(0, 28), valX, ry);
    });
    ctx.textAlign = 'left';

    // ── Divider (below info table) ───────────────────────────────────────────
    // tY=383 + 20 + 6*28 + 14 = 585
    const divY2 = tY + 20 + rows.length * rowH + 14;
    ctx.strokeStyle = GOLD; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(8, divY2); ctx.lineTo(W - 8, divY2); ctx.stroke();

    // ── Level section ────────────────────────────────────────────────────────
    const lvSecY = divY2 + 12; // 597

    // "LEVEL X" with filled box background
    const lvText = `LEVEL  ${lvl}`;
    ctx.font = 'bold 24px "Courier New"';
    const lvTW = ctx.measureText(lvText).width;
    ctx.fillStyle = GOLD_DIM;
    ctx.fillRect(18, lvSecY, lvTW + 24, 36);
    ctx.fillStyle = BG;
    ctx.fillText(lvText, 30, lvSecY + 26);

    // XP right-aligned
    const xpStr = isOwner ? '∞ / ∞ XP' : `${curXP.toLocaleString()} / ${maxXP.toLocaleString()} XP`;
    ctx.textAlign = 'right'; ctx.fillStyle = GOLD_DIM; ctx.font = '11px "Courier New"';
    ctx.fillText(xpStr, W - 18, lvSecY + 26); ctx.textAlign = 'left';

    // Progress bar with percentage text centered inside
    const bx = 18, by = lvSecY + 44, bw = W - 36, bh = 22;
    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = GOLD_DIM; ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, bh);
    const fillW = Math.max(0, pct * (bw - 2));
    if (fillW > 0) {
        const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
        grad.addColorStop(0, BAR0); grad.addColorStop(0.5, BAR1); grad.addColorStop(1, BAR2);
        ctx.fillStyle = grad;
        ctx.fillRect(bx + 1, by + 1, fillW, bh - 2);
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = pct > 0.4 ? BG : GOLD;
    ctx.font = 'bold 11px "Courier New"';
    ctx.fillText(isOwner ? '∞' : `${Math.round(pct * 100)}%`, bx + bw / 2, by + bh / 2 + 4);
    ctx.textAlign = 'left';

    // Total XP + Rank name
    const infoY = by + bh + 18; // 641 + 18 = 659 (approx)
    ctx.fillStyle = GOLD_DIM; ctx.font = '10px "Courier New"';
    ctx.fillText(`TOTAL XP: ${isOwner ? '∞' : totXP.toLocaleString()}`, 18, infoY);
    ctx.textAlign = 'right'; ctx.fillStyle = GOLD; ctx.font = 'bold 10px "Courier New"';
    ctx.fillText(`RANK: ${rankName.toUpperCase()}`, W - 18, infoY); ctx.textAlign = 'left';

    // ── Divider (below level section) ────────────────────────────────────────
    const divY3 = infoY + 14;
    ctx.strokeStyle = GOLD; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(8, divY3); ctx.lineTo(W - 8, divY3); ctx.stroke();

    // ── Neural signature + threat assessment ──────────────────────────────────
    const waveSecY = divY3 + 14;

    // Left: section label
    ctx.fillStyle = GOLD_DIM; ctx.font = '9px "Courier New"';
    ctx.fillText('NEURAL SIGNATURE  //  BIO-METRIC WAVE ANALYSIS', 18, waveSecY + 13);

    // Right: threat assessment squares
    for (let i = 0; i < 5; i++) {
        const sx = W - 18 - (5 - i) * 16, sy = waveSecY + 2, ss = 12;
        ctx.strokeStyle = GOLD; ctx.lineWidth = 1; ctx.strokeRect(sx, sy, ss, ss);
        if (i < Math.min(warnCount, 5)) {
            ctx.fillStyle = GOLD; ctx.fillRect(sx + 2, sy + 2, ss - 4, ss - 4);
        }
    }

    // Animated wave
    const waveY = waveSecY + 34;
    ctx.strokeStyle = GOLD_DIM; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 18; x <= W - 18; x++) {
        const relX = x - 18;
        const y = waveY + Math.sin(relX * 0.055 + wavePhase) * 12 * (Math.sin(relX * 0.018) * 0.6 + 0.4);
        x === 18 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Decorative dot grid in empty space below wave
    ctx.fillStyle = GOLD_DIM + '44';
    for (let gx = 35; gx < W - 35; gx += 45) {
        for (let gy = waveY + 30; gy <= waveY + 80; gy += 25) {
            ctx.beginPath(); ctx.arc(gx, gy, 1, 0, Math.PI * 2); ctx.fill();
        }
    }

    // Scan line sweeping top to bottom
    ctx.fillStyle = GOLD;
    ctx.globalAlpha = 0.07;
    ctx.fillRect(9, scanY - 1, W - 18, 3);
    ctx.globalAlpha = 0.15;
    ctx.fillRect(9, scanY, W - 18, 1);
    ctx.globalAlpha = 1;

    // ── Footer ───────────────────────────────────────────────────────────────
    ctx.strokeStyle = GOLD; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(8, H - 28); ctx.lineTo(W - 8, H - 28); ctx.stroke();

    ctx.fillStyle = GOLD_DIM; ctx.font = '8px "Courier New"';
    ctx.fillText('SYS:CLASSIFIED  //  DO NOT DISTRIBUTE', 18, H - 14);
    ctx.textAlign = 'right';
    ctx.fillText(new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC', W - 18, H - 14);
    ctx.textAlign = 'left';
}

// ─── Client ───────────────────────────────────────────────────────────────────
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
    ],
});

client.once('ready', async () => {
    console.log(`[Rank Bot] Logged in as ${client.user.tag}`);
    const guild = client.guilds.cache.get(GUILD_ID);
    if (guild) {
        await guild.members.fetch();
        guild.members.cache.forEach(m => {
            if (m.voice.channelId && !m.user.bot) voiceSessions.set(m.id, Date.now());
        });
    }
});

// ─── Voice XP ─────────────────────────────────────────────────────────────────
client.on('voiceStateUpdate', async (oldState, newState) => {
    const member = newState.member ?? oldState.member;
    if (!member || member.user.bot) return;
    const guild  = newState.guild  ?? oldState.guild;

    const wasIn = !!oldState.channelId;
    const isIn  = !!newState.channelId;

    if (!wasIn && isIn) {
        voiceSessions.set(member.id, Date.now());
    } else if (wasIn && !isIn) {
        const joinTime = voiceSessions.get(member.id);
        if (joinTime) {
            const minutes = Math.floor((Date.now() - joinTime) / 60_000);
            if (minutes > 0) await addXP(member.id, minutes * VOICE_XP, guild);
            voiceSessions.delete(member.id);
        }
    }
});

// ─── Messages ─────────────────────────────────────────────────────────────────
client.on('messageCreate', async (msg) => {
    if (msg.author.bot || !msg.guild || msg.guild.id !== GUILD_ID) return;

    // Message XP (only if not a command)
    if (!msg.content.startsWith(PREFIX)) {
        const data = loadData();
        if (!data.users[msg.author.id]) data.users[msg.author.id] = { xp: 0, lastMsg: 0 };
        const now = Date.now();
        if (now - (data.users[msg.author.id].lastMsg || 0) >= MSG_COOLDOWN) {
            data.users[msg.author.id].lastMsg = now;
            saveData(data);
            const gain = Math.floor(Math.random() * (MSG_XP_MAX - MSG_XP_MIN + 1)) + MSG_XP_MIN;
            await addXP(msg.author.id, gain, msg.guild);
        }
        return;
    }

    const args = msg.content.slice(PREFIX.length).trim().split(/\s+/);
    const cmd  = args.shift().toLowerCase();
    try { await handleCommand(msg, cmd, args); }
    catch (e) { if (e.code !== 10008) console.error(e); }
});

// ─── Commands ─────────────────────────────────────────────────────────────────
async function handleCommand(msg, cmd, args) {
    const { guild, member } = msg;
    const isAdmin = member.id === OWNER_ID;

    // ── =rank [@user] ────────────────────────────────────────────────────────
    if (cmd === 'rank') {
        let target = member;
        if (args[0]) {
            target = await guild.members.fetch(args[0].replace(/[<@!>]/g, '')).catch(() => null);
            if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        }
        const isOwner  = target.id === OWNER_ID;
        const data     = loadData();
        const userData = data.users[target.id] || { xp: 0 };
        const lvInfo   = calcLevel(userData.xp);

        const sorted     = Object.entries(data.users).sort(([,a],[,b]) => b.xp - a.xp).map(([id]) => id);
        const serverRank = isOwner ? 1 : (sorted.indexOf(target.id) + 1) || '?';

        let warnCount = 0;
        const mainData = getMainBotData();
        if (mainData?.warns?.[target.id]) warnCount = mainData.warns[target.id].count || 0;

        const notice = await msg.reply('⏳ Generating rank card...');
        try {
            const buffer = await generateCard(target, lvInfo, guild, serverRank, warnCount, isOwner);
            await notice.delete().catch(() => {});
            return msg.reply({ files: [new AttachmentBuilder(buffer, { name: 'rank.gif' })] });
        } catch (e) {
            console.error('Card generation error:', e);
            await notice.edit({ content: null, embeds: [errEmbed('Failed to generate card.')] });
        }
        return;
    }

    // ── =lb ──────────────────────────────────────────────────────────────────
    if (cmd === 'lb') {
        const data   = loadData();
        const sorted = Object.entries(data.users).sort(([,a],[,b]) => b.xp - a.xp).slice(0, 10);
        const medals = ['🥇','🥈','🥉'];
        const lines  = sorted.map(([id, u], i) => {
            const info = calcLevel(u.xp);
            return `${medals[i] ?? `**${i+1}.**`} <@${id}> — Lv.**${info.level}** · \`${u.xp.toLocaleString()} XP\``;
        });
        const e = new EmbedBuilder()
            .setTitle('🏆  FAWDA — XP Leaderboard')
            .setColor(0xFFD700)
            .setDescription(lines.join('\n') || 'No data yet.')
            .setTimestamp();
        return msg.reply({ embeds: [e] });
    }

    // ── =givexp @user [amount] ────────────────────────────────────────────────
    if (cmd === 'givexp') {
        if (!isAdmin) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await guild.members.fetch(args[0]?.replace(/[<@!>]/g, '')).catch(() => null);
        const amount = parseInt(args[1]);
        if (!target || isNaN(amount) || amount <= 0)
            return msg.reply({ embeds: [errEmbed('Usage: `=givexp @user [amount]`')] });
        await addXP(target.id, amount, guild);
        return msg.reply({ embeds: [new EmbedBuilder().setColor(0xFFD700)
            .setDescription(`✅  Added **${amount} XP** to ${target}.`)] });
    }

    // ── =resetxp @user ────────────────────────────────────────────────────────
    if (cmd === 'resetxp') {
        if (!isAdmin) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await guild.members.fetch(args[0]?.replace(/[<@!>]/g, '')).catch(() => null);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const data = loadData();
        delete data.users[target.id];
        saveData(data);
        return msg.reply({ embeds: [new EmbedBuilder().setColor(0xED4245)
            .setDescription(`🗑️  XP reset for ${target}.`)] });
    }

    // ── =help / =rankhelp ────────────────────────────────────────────────────
    if (cmd === 'help' || cmd === 'rankhelp') {
        const rankList = RANKS.map(r => `\`Lv.${r.level}\` ${r.name}`).join('\n');
        const e = new EmbedBuilder()
            .setTitle('📊  FAWDA Rank Bot — All Commands')
            .setColor(0xFFD700)
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                {
                    name: '👤  Member',
                    value: [
                        '`=rank` — Affiche ta carte de rang',
                        '`=rank @user` — Carte d\'un autre membre',
                        '`=lb` — Classement top 10 XP',
                    ].join('\n'),
                    inline: false,
                },
                {
                    name: '🛡️  Staff / Admin',
                    value: [
                        '`=givexp @user [n]` — Donner des XP',
                        '`=resetxp @user` — Remettre les XP à 0',
                    ].join('\n'),
                    inline: false,
                },
                {
                    name: '⚡  Comment gagner des XP',
                    value: '💬 **Messages** — 15 à 25 XP par message (cooldown 60s)\n🔊 **Vocal** — 10 XP par minute passée en vocal',
                    inline: false,
                },
                {
                    name: '🏆  Paliers de rang',
                    value: rankList,
                    inline: true,
                },
                {
                    name: '🎨  Couleur de carte',
                    value: 'La couleur change selon ton rang actuel',
                    inline: true,
                },
            )
            .setFooter({ text: 'Préfixe : =  •  Owner = Level 9999 ∞' })
            .setTimestamp();
        return msg.reply({ embeds: [e] });
    }
}

function errEmbed(text) {
    return new EmbedBuilder().setColor(0xED4245).setDescription(`❌  ${text}`);
}

client.login(TOKEN);
