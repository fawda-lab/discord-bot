const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
const registered = GlobalFonts.registerFromPath(path.join(__dirname, '../../fonts/LiberationSans-Regular.ttf'), 'Liberation Sans');
console.log('Font registered:', registered);
const log = require('../../logger')('RankBot');
const Member = require('../../utils/models/Member');
const { calcLevel, getRankName, getMember } = require('../../utils/dataManager');
const { errEmbed } = require('../../utils/embeds');
const { OWNER_ID } = require('../../utils/constants');

function getRankColors(level) {
    if (level >= 100) return { P: '#D8B4FE', D: '#6B21A8', BAR0: '#3B0764', BAR1: '#D8B4FE', BAR2: '#A855F7' };
    if (level >= 90)  return { P: '#BAE6FD', D: '#1E40AF', BAR0: '#0C2561', BAR1: '#BAE6FD', BAR2: '#60A5FA' };
    if (level >= 80)  return { P: '#6EE7B7', D: '#065F46', BAR0: '#022C22', BAR1: '#6EE7B7', BAR2: '#10B981' };
    if (level >= 70)  return { P: '#FDBA74', D: '#92400E', BAR0: '#431407', BAR1: '#FDBA74', BAR2: '#F97316' };
    if (level >= 60)  return { P: '#FCA5A5', D: '#7F1D1D', BAR0: '#450A0A', BAR1: '#FCA5A5', BAR2: '#EF4444' };
    if (level >= 50)  return { P: '#93C5FD', D: '#1E3A5F', BAR0: '#0A1628', BAR1: '#93C5FD', BAR2: '#3B82F6' };
    if (level >= 40)  return { P: '#FCD34D', D: '#78350F', BAR0: '#2D1500', BAR1: '#FCD34D', BAR2: '#F59E0B' };
    if (level >= 30)  return { P: '#7DD3FC', D: '#0C4A6E', BAR0: '#062030', BAR1: '#7DD3FC', BAR2: '#0EA5E9' };
    if (level >= 20)  return { P: '#C084FC', D: '#581C87', BAR0: '#1E0533', BAR1: '#C084FC', BAR2: '#A855F7' };
    if (level >= 10)  return { P: '#D97706', D: '#6B3A1F', BAR0: '#2A1200', BAR1: '#D97706', BAR2: '#B45309' };
    return                   { P: '#94A3B8', D: '#334155', BAR0: '#0F172A', BAR1: '#94A3B8', BAR2: '#64748B' };
}

async function generateCard(member, levelInfo, guild, serverRank, warnCount, isOwner) {
    let avatarImg = null;
    try { avatarImg = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 128 })); }
    catch (e) { log.debug('[DEBUG]', e.message); }

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

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, accentDark + 'dd');
    bg.addColorStop(1, '#0d0d18');
    rr(0, 0, W, H, 20); ctx.fillStyle = bg; ctx.fill();
    rr(0, 0, W, H, 20); ctx.strokeStyle = accent + '99'; ctx.lineWidth = 2; ctx.stroke();
    rr(0, 0, 7, H, 4);  ctx.fillStyle = accent; ctx.fill();

    const avR = 38, avCX = 65, avCY = 65;
    ctx.save();
    rr(avCX - avR, avCY - avR, avR * 2, avR * 2, avR);
    ctx.clip();
    if (avatarImg) ctx.drawImage(avatarImg, avCX - avR, avCY - avR, avR * 2, avR * 2);
    else { ctx.fillStyle = accentDark; ctx.fill(); }
    ctx.restore();
    ctx.beginPath(); ctx.arc(avCX, avCY, avR + 3, 0, Math.PI * 2);
    ctx.strokeStyle = accent; ctx.lineWidth = 3; ctx.stroke();

    const nameX = avCX + avR + 16;
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px "Liberation Sans"';
    ctx.fillText(member.displayName.substring(0, 22), nameX, 52);

    const xpLabel = isOwner ? '∞ XP' : `+${totXP.toLocaleString()} XP`;
    ctx.font = 'bold 12px "Liberation Sans"';
    const bw = ctx.measureText(xpLabel).width + 18;
    rr(nameX, 60, bw, 22, 11); ctx.fillStyle = accent + '30'; ctx.fill();
    rr(nameX, 60, bw, 22, 11); ctx.strokeStyle = accent; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = accent; ctx.fillText(xpLabel, nameX + 9, 75);

    ctx.textAlign = 'right';
    ctx.fillStyle = accent; ctx.font = 'bold 13px "Liberation Sans"';
    ctx.fillText(rankName.toUpperCase(), W - 18, 52);
    ctx.fillStyle = '#ffffff88'; ctx.font = '11px "Liberation Sans"';
    ctx.fillText(`Level ${lvl}`, W - 18, 70);
    ctx.textAlign = 'left';

    ctx.strokeStyle = accent + '40'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(18, 98); ctx.lineTo(W - 18, 98); ctx.stroke();

    const p1x = 18, p1y = 108, p1w = 318, p1h = 98;
    rr(p1x, p1y, p1w, p1h, 14); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
    rr(p1x, p1y, p1w, p1h, 14); ctx.strokeStyle = accent + '40'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = accent; ctx.font = 'bold 11px "Liberation Sans"';
    ctx.fillText('Level Info', p1x + 14, p1y + 18);
    ctx.fillStyle = '#ffffffbb'; ctx.font = '13px "Liberation Sans"';
    ctx.fillText('▣  Message Level:', p1x + 14, p1y + 42);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px "Liberation Sans"';
    ctx.fillText(`${lvl}`, p1x + 158, p1y + 42);
    ctx.fillStyle = '#ffffffbb'; ctx.font = '13px "Liberation Sans"';
    ctx.fillText('◈  Progress:', p1x + 14, p1y + 62);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px "Liberation Sans"';
    ctx.fillText(isOwner ? '∞' : `${Math.round(pct * 100)}%`, p1x + 158, p1y + 62);

    const pbx = p1x + 14, pby = p1y + 74, pbw = p1w - 28, pbh = 10;
    rr(pbx, pby, pbw, pbh, 5); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill();
    if (pct > 0) {
        const g = ctx.createLinearGradient(pbx, 0, pbx + pbw, 0);
        g.addColorStop(0, BAR0); g.addColorStop(0.5, BAR1); g.addColorStop(1, BAR2);
        rr(pbx, pby, Math.max(pct * pbw, 10), pbh, 5);
        ctx.fillStyle = g; ctx.fill();
    }

    const p2x = p1x + p1w + 10, p2y = 108, p2w = W - p2x - 18, p2h = 98;
    rr(p2x, p2y, p2w, p2h, 14); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
    rr(p2x, p2y, p2w, p2h, 14); ctx.strokeStyle = accent + '40'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = accent; ctx.font = 'bold 11px "Liberation Sans"';
    ctx.fillText('Rank Info', p2x + 14, p2y + 18);
    ctx.fillStyle = '#ffffffbb'; ctx.font = '13px "Liberation Sans"';
    ctx.fillText('▣  Server Rank:', p2x + 14, p2y + 42);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px "Liberation Sans"';
    ctx.fillText(`#${serverRank}`, p2x + 178, p2y + 42);
    ctx.fillStyle = '#ffffffbb'; ctx.font = '13px "Liberation Sans"';
    ctx.fillText('◈  Total XP:', p2x + 14, p2y + 62);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px "Liberation Sans"';
    ctx.fillText(isOwner ? '∞' : totXP.toLocaleString(), p2x + 178, p2y + 62);

    for (let i = 0; i < 5; i++) {
        const dx = p2x + 14 + i * 18, dy = p2y + 78;
        ctx.beginPath(); ctx.arc(dx, dy, 6, 0, Math.PI * 2);
        ctx.fillStyle = i < warnCount ? '#EF4444' : 'rgba(255,255,255,0.15)'; ctx.fill();
    }

    return canvas.toBuffer('image/png');
}

module.exports = {
    name: 'rank',
    cooldown: 15,
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        let target = member;
        if (args[0]) {
            target = await guild.members.fetch(args[0].replace(/[<@!>]/g, '')).catch(() => null);
            if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        }
        const isOwner  = target.id === OWNER_ID;
        const doc      = await getMember(target.id);
        const lvInfo   = calcLevel(doc.xp);

        const serverRank = isOwner ? 1 : (await Member.countDocuments({ xp: { $gt: doc.xp } }) + 1);

        const warnCount = doc.warns?.length ?? 0;

        const notice = await msg.reply('⏳ Generating rank card...');
        try {
            const buffer = await generateCard(target, lvInfo, guild, serverRank, warnCount, isOwner);
            await notice.delete().catch(e => log.debug('[DEBUG]', e.message));
            return msg.reply({ files: [new AttachmentBuilder(buffer, { name: 'rank.png' })] });
        } catch (e) {
            log.error('Card generation error:', e);
            await notice.edit({ content: null, embeds: [errEmbed('Failed to generate card.')] });
        }
    },
};
