const log = require('./logger')('RankBot');

const http = require('http');
const server = http.createServer((req, res) => {
  try {
    res.writeHead(200);
    res.end('Bot is alive!');
  } catch (e) {
    log.error('HTTP Server Error:', e);
  }
});
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        log.error(`[HTTP] Port ${process.env.PORT || 3000} is already in use.`);
        process.exit(1);
    }
    log.error('[HTTP] Server error:', err);
});
server.listen(process.env.PORT || 3000);

process.on('unhandledRejection', (reason, promise) => {
    log.error('[Anti-Crash] Unhandled Rejection at:', promise);
    log.error('[Anti-Crash] Reason:', reason?.stack ?? reason);
});
process.on('uncaughtException', (err) => {
    log.error('[Anti-Crash] Uncaught Exception:', err.message);
    log.error(err.stack);
});

const {
    Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder, PermissionFlagsBits,
} = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs   = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────
const TOKEN      = process.env.RANK_TOKEN;
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
function saveData(d) {
    const tmp = DATA_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(d, null, 2), 'utf8');
    fs.renameSync(tmp, DATA_FILE);
}

function getMainBotData() {
    try {
        const p = path.join(__dirname, 'data.json');
        if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) { log.debug('[DEBUG]', e.message); }
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
            await member.roles.remove(rank.id).catch(e => log.debug('[DEBUG]', e.message));
    }
    const role = guild.roles.cache.get(milestone.id);
    if (role) await member.roles.add(role).catch(e => log.debug('[DEBUG]', e.message));

    await member.send(
        `🎉 You reached **Level ${newLevel}** in **FAWDA**!\n` +
        `You unlocked the rank **${milestone.name}**! Congrats!`
    ).catch(e => log.debug('[DEBUG]', e.message));
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

// ─── Card generator (static PNG) ─────────────────────────────────────────────
async function generateCard(member, levelInfo, guild, serverRank, warnCount, isOwner) {
    let avatarImg = null;
    try { avatarImg = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 128 })); } catch (e) { log.debug('[DEBUG]', e.message); }

    const W = 700, H = 220;
    const canvas = createCanvas(W, H);
    const ctx    = canvas.getContext('2d');

    const lvl      = isOwner ? 9999 : levelInfo.level;
    const curXP    = isOwner ? Infinity : levelInfo.currentXP;
    const maxXP    = isOwner ? Infinity : levelInfo.neededXP;
    const totXP    = isOwner ? Infinity : levelInfo.totalXP;
    const pct      = isOwner ? 1 : Math.min(1, curXP / maxXP);
    const rankName = isOwner ? '»Royal' : getRankName(lvl);
    const { P: accent, D: accentDark, BAR0, BAR1, BAR2 } = getRankColors(lvl);

    // rounded rect path helper
    function rr(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y,     x + w, y + r,     r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x,     y + h, x,     y + h - r, r);
        ctx.lineTo(x,     y + r);
        ctx.arcTo(x,     y,     x + r, y,          r);
        ctx.closePath();
    }

    // ── Card background ──────────────────────────────────────────────────────
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, accentDark + 'dd');
    bg.addColorStop(1, '#0d0d18');
    rr(0, 0, W, H, 20); ctx.fillStyle = bg; ctx.fill();

    // Card border
    rr(0, 0, W, H, 20);
    ctx.strokeStyle = accent + '99'; ctx.lineWidth = 2; ctx.stroke();

    // Left accent stripe
    rr(0, 0, 7, H, 4); ctx.fillStyle = accent; ctx.fill();

    // ── Avatar ───────────────────────────────────────────────────────────────
    const avR = 38, avCX = 65, avCY = 65;
    ctx.save();
    rr(avCX - avR, avCY - avR, avR * 2, avR * 2, avR);
    ctx.clip();
    if (avatarImg) ctx.drawImage(avatarImg, avCX - avR, avCY - avR, avR * 2, avR * 2);
    else { ctx.fillStyle = accentDark; ctx.fill(); }
    ctx.restore();
    ctx.beginPath(); ctx.arc(avCX, avCY, avR + 3, 0, Math.PI * 2);
    ctx.strokeStyle = accent; ctx.lineWidth = 3; ctx.stroke();

    // ── Username + XP badge ──────────────────────────────────────────────────
    const nameX = avCX + avR + 16;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Arial"';
    ctx.fillText(member.displayName.substring(0, 22), nameX, 52);

    const xpLabel = isOwner ? '∞ XP' : `+${totXP.toLocaleString()} XP`;
    ctx.font = 'bold 12px "Arial"';
    const bw = ctx.measureText(xpLabel).width + 18;
    rr(nameX, 60, bw, 22, 11); ctx.fillStyle = accent + '30'; ctx.fill();
    rr(nameX, 60, bw, 22, 11); ctx.strokeStyle = accent; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = accent; ctx.fillText(xpLabel, nameX + 9, 75);

    // Rank name top-right
    ctx.textAlign = 'right';
    ctx.fillStyle = accent; ctx.font = 'bold 13px "Arial"';
    ctx.fillText(rankName.toUpperCase(), W - 18, 52);
    ctx.fillStyle = '#ffffff88'; ctx.font = '11px "Arial"';
    ctx.fillText(`Level ${lvl}`, W - 18, 70);
    ctx.textAlign = 'left';

    // ── Separator ────────────────────────────────────────────────────────────
    ctx.strokeStyle = accent + '40'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(18, 98); ctx.lineTo(W - 18, 98); ctx.stroke();

    // ── Left panel — Level Info ───────────────────────────────────────────────
    const p1x = 18, p1y = 108, p1w = 318, p1h = 98;
    rr(p1x, p1y, p1w, p1h, 14); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
    rr(p1x, p1y, p1w, p1h, 14); ctx.strokeStyle = accent + '40'; ctx.lineWidth = 1; ctx.stroke();

    ctx.fillStyle = accent; ctx.font = 'bold 11px "Arial"';
    ctx.fillText('Level Info', p1x + 14, p1y + 18);

    ctx.fillStyle = '#ffffffbb'; ctx.font = '13px "Arial"';
    ctx.fillText('▣  Message Level:', p1x + 14, p1y + 42);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px "Arial"';
    ctx.fillText(`${lvl}`, p1x + 158, p1y + 42);

    ctx.fillStyle = '#ffffffbb'; ctx.font = '13px "Arial"';
    ctx.fillText('◈  Progress:', p1x + 14, p1y + 62);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px "Arial"';
    ctx.fillText(isOwner ? '∞' : `${Math.round(pct * 100)}%`, p1x + 158, p1y + 62);

    // progress bar
    const pbx = p1x + 14, pby = p1y + 74, pbw = p1w - 28, pbh = 10;
    rr(pbx, pby, pbw, pbh, 5); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill();
    if (pct > 0) {
        const g = ctx.createLinearGradient(pbx, 0, pbx + pbw, 0);
        g.addColorStop(0, BAR0); g.addColorStop(0.5, BAR1); g.addColorStop(1, BAR2);
        rr(pbx, pby, Math.max(pct * pbw, 10), pbh, 5);
        ctx.fillStyle = g; ctx.fill();
    }

    // ── Right panel — Rank Info ───────────────────────────────────────────────
    const p2x = p1x + p1w + 10, p2y = 108, p2w = W - p2x - 18, p2h = 98;
    rr(p2x, p2y, p2w, p2h, 14); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
    rr(p2x, p2y, p2w, p2h, 14); ctx.strokeStyle = accent + '40'; ctx.lineWidth = 1; ctx.stroke();

    ctx.fillStyle = accent; ctx.font = 'bold 11px "Arial"';
    ctx.fillText('Rank Info', p2x + 14, p2y + 18);

    ctx.fillStyle = '#ffffffbb'; ctx.font = '13px "Arial"';
    ctx.fillText('▣  Server Rank:', p2x + 14, p2y + 42);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px "Arial"';
    ctx.fillText(`#${serverRank}`, p2x + 178, p2y + 42);

    ctx.fillStyle = '#ffffffbb'; ctx.font = '13px "Arial"';
    ctx.fillText('◈  Total XP:', p2x + 14, p2y + 62);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px "Arial"';
    ctx.fillText(isOwner ? '∞' : totXP.toLocaleString(), p2x + 178, p2y + 62);

    // warn dots
    for (let i = 0; i < 5; i++) {
        const dx = p2x + 14 + i * 18, dy = p2y + 78;
        ctx.beginPath(); ctx.arc(dx, dy, 6, 0, Math.PI * 2);
        ctx.fillStyle = i < warnCount ? '#EF4444' : 'rgba(255,255,255,0.15)'; ctx.fill();
    }

    return canvas.toBuffer('image/png');
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
    log.info(`[Rank Bot] Logged in as ${client.user.tag}`);
    const guild = client.guilds.cache.get(GUILD_ID);
    if (guild) {
        await guild.members.fetch();
        guild.members.cache.forEach(m => {
            if (m.voice.channelId && !m.user.bot) voiceSessions.set(m.id, Date.now());
        });
    }
});

client.on('error', (err) => log.error('[Discord Client Error]', err));
client.on('warn', (info) => log.warn('[Discord Client Warning]', info));
client.on('rateLimit', (info) => log.warn('[Discord Rate Limit]', info));

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
    try {
        await handleCommand(msg, cmd, args);
    } catch (e) {
        logCommandError(e, cmd, msg, args);
        msg.reply('❌ An error occurred.').catch(e => log.debug('[DEBUG]', e.message));
    }
});

function logCommandError(err, cmd, msg, args) {
    log.error(
        `[Command Error] cmd=${cmd} user=${msg.author.tag} (${msg.author.id}) ` +
        `args=${JSON.stringify(args)} guild=${msg.guild?.name} (${msg.guild?.id})\n` +
        (err.stack ?? err)
    );
}

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
            await notice.delete().catch(e => log.debug('[DEBUG]', e.message));
            return msg.reply({ files: [new AttachmentBuilder(buffer, { name: 'rank.png' })] });
        } catch (e) {
            log.error('Card generation error:', e);
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

async function gracefulShutdown(signal) {
    log.info(`[Rank Bot] Received ${signal}, shutting down gracefully...`);
    const guild = client.guilds.cache.get(GUILD_ID);
    if (guild) {
        for (const [userId, joinTime] of voiceSessions) {
            const minutes = Math.floor((Date.now() - joinTime) / 60_000);
            if (minutes > 0) {
                try { await addXP(userId, minutes * VOICE_XP, guild); }
                catch (e) { log.debug('[DEBUG]', e.message); }
            }
        }
    }
    try { client.destroy(); } catch (e) { log.debug('[DEBUG]', e.message); }
    server.close(() => process.exit(0));
}
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

client.login(TOKEN);
