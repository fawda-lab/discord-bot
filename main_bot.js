const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is alive!');
}).listen(process.env.PORT || 3001);

const {
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder,
    ButtonBuilder, ButtonStyle, PermissionFlagsBits,
} = require('discord.js');
const fs   = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────
const TOKEN     = process.env.MAIN_TOKEN;
const PREFIX    = '+';
const DATA_FILE = 'data.json';

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
    VERIF:   0x57F287,  // green
    GIRL:    0xFF79C6,  // pink
    JAIL:    0xED4245,  // red
    WARN:    0xFEE75C,  // yellow
    TIMEOUT: 0xEB459E,  // fuchsia
    VOICE:   0x5865F2,  // blurple
    INFO:    0x5865F2,  // blurple
    GOLD:    0xF1C40F,  // gold
    ERROR:   0xED4245,  // red
    MUTED:   0x99AAB5,  // grey
};

// ─── Role IDs ─────────────────────────────────────────────────────────────────
const ROLES = {
    BOY:         '1487864723096473813',
    GIRL:        '1487864722257743932',
    MALE:        '1487864724585451582',
    FEMALE:      '1487864725470449684',
    UNVERIFIED:  '1487864723839123539',
    VERIF:       '1487864605660151849',
    JAIL:        '1487864720596799688',
    FIRST_WARN:  '1487864728104468580',
    SECOND_WARN: '1487864727328784475',
    LAST_WARN:   '1487864726439591996',
    MUTED:       '1487864718117834964',
    STAFF:       '1487864597795966976',
};

// ─── Game Roles ───────────────────────────────────────────────────────────────
const GAME_ROLES = {
    pes: '1487864760417652858', amongus: '1487864741262004435',
    freefire: '1487864742621216920', codenames: '1487864758060322976',
    lol: '1487864750833401916', valorant: '1487864751890501743',
    plato: '1487864760102948934', minecraft: '1487864749176918216',
    stumbleguys: '1487864747612180602', brawlhalla: '1487864746635169933',
    csgo: '1487864749986156657', roblox: '1487864756458225807',
    pubg: '1487864745565622293', parchisi: '1487864763307393125',
    fifa: '1487864758802845797', gta: '1487864744147947691',
    cod: '1487864745049722920', fortnite: '1489995710362288309',
    monopoly: '1487864754591760406', bloodstrike: '1487864761692459110',
    chess: '1487864757271789708',
};

const GAME_COOLDOWN = 30 * 60 * 1000;
const gameCooldowns = new Map();
const ONE_TAP_1 = '1487866287278260234';

// ─── Data ─────────────────────────────────────────────────────────────────────
function loadData() {
    if (!fs.existsSync(DATA_FILE))
        return { warns: {}, jailed: {}, sasList: [], verifications: {}, jailActions: {} };
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}
function saveData(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2), 'utf8'); }
function sleep(ms)   { return new Promise(r => setTimeout(r, ms)); }

// ─── Design helpers ───────────────────────────────────────────────────────────
function ft(client) {
    return { text: 'FAWDA Bot', iconURL: client.user.displayAvatarURL() };
}
function errEmbed(text) {
    return new EmbedBuilder().setColor(C.ERROR).setDescription(`❌  ${text}`);
}
function warnBar(count) {
    const filled = Math.min(count, 3);
    return '🟥'.repeat(filled) + '⬜'.repeat(3 - filled);
}
function warnColor(count) {
    if (count >= 3) return C.JAIL;
    if (count === 2) return 0xFF7043;
    return C.WARN;
}
const MEDALS = ['🥇', '🥈', '🥉'];
function rank(i) { return MEDALS[i] ?? `**${i + 1}.**`; }

// ─── Client ───────────────────────────────────────────────────────────────────
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
    ],
});

client.on('ready', () => console.log(`[Main Bot] Logged in as ${client.user.tag}`));

// ─── Help panel ───────────────────────────────────────────────────────────────
function buildHelpRows() {
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_verification').setLabel('✅ Verification').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('help_jail').setLabel('🔒 Jail').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('help_warn').setLabel('⚠️ Warn').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('help_timeout').setLabel('⏱️ Timeout').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('help_voice').setLabel('🔊 Voice').setStyle(ButtonStyle.Primary),
    );
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_info').setLabel('📋 Info').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('help_games').setLabel('🎮 Games').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('help_dm').setLabel('📨 Save to DM').setStyle(ButtonStyle.Primary),
    );
    return [row1, row2];
}

const HELP_PANELS = {
    help_verification: () => new EmbedBuilder().setTitle('✅  Verification Commands').setColor(C.VERIF)
        .setDescription(
            '`+vb [@user]` — Verify as Boy\n' +
            '`+vg [@user]` — Verify as Girl\n' +
            '`+sas [@user]` — Add to Sas List\n' +
            '`+unsas [@user]` — Remove from Sas List\n' +
            '`+saslist` — Show Sas List\n' +
            '`+lbvb` — Top 10 Verification Staff'
        ).setFooter({ text: 'Staff Team · Verification role · Admin' }),
    help_jail: () => new EmbedBuilder().setTitle('🔒  Jail Commands').setColor(C.JAIL)
        .setDescription(
            '`+jail [@user] [reason]` — Jail a member\n' +
            '`+unjail [@user]` — Unjail as Boy\n' +
            '`+unjail [@user] g` — Unjail as Girl\n' +
            '`+jailcase [@user]` — Show jail case\n' +
            '`+lbj` — Top 10 Jailers'
        ).setFooter({ text: 'Staff Team · Admin' }),
    help_warn: () => new EmbedBuilder().setTitle('⚠️  Warn Commands').setColor(C.WARN)
        .setDescription(
            '`+warn [@user] [reason]` — Warn a member\n' +
            '`+unwarn [@user]` — Remove 1 warn\n' +
            '`+warns [@user]` — Show warns\n\n' +
            '`1 warn` → First Warn\n`2 warns` → Second Warn\n`3 warns` → Last Warn + Muted\n`4+ warns` → Auto-kick'
        ).setFooter({ text: 'Staff Team · Admin' }),
    help_timeout: () => new EmbedBuilder().setTitle('⏱️  Timeout Commands').setColor(C.TIMEOUT)
        .setDescription(
            '`+timeout [@user] [durée] [raison]` — Timeout un membre\n\n' +
            '`s` secondes · `m` minutes · `h` heures · `d` jours\n' +
            'Exemple : `+timeout @user 10m spam`\n' +
            'Maximum : 28 jours'
        ).setFooter({ text: 'Staff Team · Admin' }),
    help_voice: () => new EmbedBuilder().setTitle('🔊  Voice Commands').setColor(C.VOICE)
        .setDescription(
            '`+vc` — Server statistics\n' +
            '`+join` — Bot joins your voice channel\n' +
            '`+aji [@user] [#channel]` — Move member (no channel = your vc)\n' +
            '`+vkick [@user]` — Kick from voice\n' +
            '`+ot` — Move yourself to One Tap 1\n' +
            '`+ms7 [1-100]` — Bulk delete messages'
        ).setFooter({ text: '+ot is open to everyone' }),
    help_info: () => new EmbedBuilder().setTitle('📋  Info Commands').setColor(C.INFO)
        .setDescription(
            '`+a [@user]` — Avatar\n' +
            '`+b [@user]` — Banner\n' +
            '`+user [@user]` — Member info\n' +
            '`+staff [@user]` — Staff info\n' +
            '`+myinvites` — Your active invites\n' +
            '`+inviteowner [code]` — Invite link owner\n' +
            '`+lbvb` — Top 10 verifiers\n' +
            '`+lbj` — Top 10 jailers'
        ).setFooter({ text: 'Open to everyone' }),
    help_games: () => new EmbedBuilder().setTitle('🎮  Game Mention Commands').setColor(C.GOLD)
        .setDescription(
            '`+pes` `+among` `+ff` `+codenames` `+lol`\n' +
            '`+valo` `+plato` `+mc` `+stumble` `+brawl`\n' +
            '`+cs` `+roblox` `+pubg` `+parchisi` `+fifa`\n' +
            '`+gta` `+cod` `+fortnite` `+monopoly`\n' +
            '`+bloodstrike` `+chess`\n\n' +
            '⏳ Cooldown: **30 minutes** per channel'
        ).setFooter({ text: 'Open to everyone' }),
};

function buildAllCommandsDm(guild) {
    return (
        `**FAWDA Bot — All Commands**\nServer: ${guild.name}\n\n` +
        `**VERIFICATION**\n+vb @user | +vg @user | +sas @user | +unsas @user | +saslist | +lbvb\n\n` +
        `**JAIL**\n+jail @user [reason] | +unjail @user | +unjail @user g | +jailcase @user | +lbj\n\n` +
        `**WARN**\n+warn @user [reason] | +unwarn @user | +warns @user\n\n` +
        `**TIMEOUT**\n+timeout @user [10m] [reason]\n\n` +
        `**VOICE**\n+join | +vc | +aji @user [#channel] | +vkick @user | +ot | +ms7 [n]\n\n` +
        `**INFO**\n+a @user | +b @user | +user @user | +staff @user | +myinvites | +inviteowner [code]\n\n` +
        `**GAMES** (30min cooldown per channel)\n+pes +among +ff +codenames +lol +valo +plato +mc\n+stumble +brawl +cs +roblox +pubg +parchisi +fifa +gta +cod +fortnite +monopoly +bloodstrike +chess`
    );
}

// ─── Button interactions ──────────────────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    const id = interaction.customId;
    if (id === 'help_dm') {
        try {
            await interaction.user.send(buildAllCommandsDm(interaction.guild));
            await interaction.reply({ content: '📨 Commands sent to your DMs!', ephemeral: true });
        } catch {
            await interaction.reply({ content: "❌ Couldn't DM you. Check your privacy settings.", ephemeral: true });
        }
        return;
    }
    const builder = HELP_PANELS[id];
    if (builder) await interaction.reply({ embeds: [builder()], ephemeral: true });
});

// ─── Rayss mention easter egg ─────────────────────────────────────────────────
const RAYSS_ID   = '1430652121375838254';
const RAYSS_IMG  = path.join(__dirname, 'rayss.jpg');

// ─── Message handler ──────────────────────────────────────────────────────────
client.on('messageCreate', async (msg) => {
    if (msg.author.bot || !msg.guild) return;

    if (msg.content.includes(`<@${RAYSS_ID}>`) && fs.existsSync(RAYSS_IMG)) {
        await msg.reply({ files: [RAYSS_IMG] }).catch(() => {});
    }

    if (!msg.content.startsWith(PREFIX)) return;
    const args = msg.content.slice(PREFIX.length).trim().split(/\s+/);
    const cmd  = args.shift().toLowerCase();
    try { await handleCommand(msg, cmd, args); }
    catch (e) { if (e.code !== 10008) console.error(e); }
});

async function handleCommand(msg, cmd, args) {
    const { guild, member, channel } = msg;
    const data = loadData();

    // ── +help ─────────────────────────────────────────────────────────────────
    if (cmd === 'help') {
        const e = new EmbedBuilder()
            .setAuthor({ name: guild.name, iconURL: guild.iconURL({ dynamic: true }) })
            .setTitle('📖  FAWDA Bot — Command Panel')
            .setDescription('Select a category below to view its commands.\nClick **📨 Save to DM** to receive the full list in your DMs.')
            .setColor(C.VOICE)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .setFooter({ text: `Requested by ${member.displayName}`, iconURL: member.user.displayAvatarURL() })
            .setTimestamp();
        return msg.reply({ embeds: [e], components: buildHelpRows() });
    }

    // ════════════════════════════════════════════════════════════
    //  VERIFICATION
    // ════════════════════════════════════════════════════════════

    if (cmd === 'vb') {
        if (!hasVerifPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const boy  = guild.roles.cache.get(ROLES.BOY);
        const male = guild.roles.cache.get(ROLES.MALE);
        const unv  = guild.roles.cache.get(ROLES.UNVERIFIED);
        if (boy)  await target.roles.add(boy).catch(() => {});
        if (male) await target.roles.add(male).catch(() => {});
        if (unv)  await target.roles.remove(unv).catch(() => {});
        data.verifications[member.id] = (data.verifications[member.id] || 0) + 1;
        saveData(data);
        const e = new EmbedBuilder()
            .setAuthor({ name: member.displayName, iconURL: member.user.displayAvatarURL() })
            .setTitle('✅  Verified as Boy')
            .setColor(C.VERIF)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 Member',  value: `${target}`,            inline: true },
                { name: '🛡️ By',     value: `${member}`,            inline: true },
                { name: '📊 Total',   value: `\`${data.verifications[member.id]}\` verifications`, inline: true },
            )
            .setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    }

    if (cmd === 'vg') {
        if (!hasVerifPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const girl   = guild.roles.cache.get(ROLES.GIRL);
        const female = guild.roles.cache.get(ROLES.FEMALE);
        const unv    = guild.roles.cache.get(ROLES.UNVERIFIED);
        if (girl)   await target.roles.add(girl).catch(() => {});
        if (female) await target.roles.add(female).catch(() => {});
        if (unv)    await target.roles.remove(unv).catch(() => {});
        data.verifications[member.id] = (data.verifications[member.id] || 0) + 1;
        saveData(data);
        const e = new EmbedBuilder()
            .setAuthor({ name: member.displayName, iconURL: member.user.displayAvatarURL() })
            .setTitle('✅  Verified as Girl')
            .setColor(C.GIRL)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 Member', value: `${target}`,            inline: true },
                { name: '🛡️ By',    value: `${member}`,            inline: true },
                { name: '📊 Total',  value: `\`${data.verifications[member.id]}\` verifications`, inline: true },
            )
            .setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    }

    if (cmd === 'lbvb') {
        const sorted = Object.entries(data.verifications).sort(([,a],[,b]) => b - a).slice(0, 10);
        const lines  = sorted.map(([uid, n], i) => `${rank(i)} <@${uid}> — **${n}** verifications`);
        const e = new EmbedBuilder()
            .setTitle('🏆  Top 10 — Verification Staff')
            .setColor(C.GOLD)
            .setDescription(lines.join('\n') || 'No data yet.')
            .setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    }

    if (cmd === 'sas') {
        if (!hasVerifPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        if (!data.sasList.includes(target.id)) data.sasList.push(target.id);
        saveData(data);
        const e = new EmbedBuilder().setColor(C.WARN)
            .setDescription(`📋  ${target} added to the **Sas List**.`)
            .setFooter(ft(client));
        return msg.reply({ embeds: [e] });
    }

    if (cmd === 'unsas') {
        if (!hasVerifPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        data.sasList = data.sasList.filter(id => id !== target.id);
        saveData(data);
        const e = new EmbedBuilder().setColor(C.VERIF)
            .setDescription(`✅  ${target} removed from the **Sas List**.`)
            .setFooter(ft(client));
        return msg.reply({ embeds: [e] });
    }

    if (cmd === 'saslist') {
        if (!data.sasList.length) return msg.reply({ embeds: [errEmbed('Sas list is empty.')] });
        const e = new EmbedBuilder()
            .setTitle('📋  Sas List')
            .setColor(C.WARN)
            .setDescription(data.sasList.map((id, i) => `**${i + 1}.** <@${id}>`).join('\n'))
            .setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    }

    // ════════════════════════════════════════════════════════════
    //  JAIL
    // ════════════════════════════════════════════════════════════

    if (cmd === 'jail') {
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const reason   = args.slice(1).join(' ') || 'No reason provided';
        const jailRole = guild.roles.cache.get(ROLES.JAIL);
        if (jailRole) {
            const rolesToRemove = target.roles.cache.filter(r => r.id !== guild.roles.everyone.id && r.id !== ROLES.JAIL);
            for (const [, r] of rolesToRemove) { await target.roles.remove(r).catch(() => {}); await sleep(300); }
            await target.roles.add(jailRole).catch(() => {});
        }
        data.jailed[target.id] = {
            reason, jailedBy: member.id,
            rolesSnapshot: target.roles.cache.map(r => r.id).filter(id => id !== guild.roles.everyone.id),
            timestamp: new Date().toISOString(),
        };
        data.jailActions[member.id] = (data.jailActions[member.id] || 0) + 1;
        saveData(data);
        const e = new EmbedBuilder()
            .setAuthor({ name: member.displayName, iconURL: member.user.displayAvatarURL() })
            .setTitle('🔒  Member Jailed')
            .setColor(C.JAIL)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 Member', value: `${target}`,  inline: true },
                { name: '🛡️ By',    value: `${member}`,  inline: true },
                { name: '📝 Reason', value: reason,        inline: false },
            )
            .setFooter(ft(client)).setTimestamp();
        await msg.reply({ embeds: [e] });
        await target.send(`🔒 You have been **jailed** in **${guild.name}**.\n📝 Reason: ${reason}`).catch(() => {});
        return;
    }

    if (cmd === 'unjail') {
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target  = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const isGirl  = args[1]?.toLowerCase() === 'g';
        const jailData = data.jailed[target.id];
        if (!jailData) return msg.reply({ embeds: [errEmbed('That member is not jailed.')] });
        const jailRole = guild.roles.cache.get(ROLES.JAIL);
        if (jailRole) await target.roles.remove(jailRole).catch(() => {});
        const roleToAdd = guild.roles.cache.get(isGirl ? ROLES.GIRL : ROLES.BOY);
        if (roleToAdd) await target.roles.add(roleToAdd).catch(() => {});
        delete data.jailed[target.id];
        saveData(data);
        const e = new EmbedBuilder()
            .setAuthor({ name: member.displayName, iconURL: member.user.displayAvatarURL() })
            .setTitle(`🔓  Unjailed as ${isGirl ? 'Girl' : 'Boy'}`)
            .setColor(C.VERIF)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 Member', value: `${target}`, inline: true },
                { name: '🛡️ By',    value: `${member}`, inline: true },
            )
            .setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    }

    if (cmd === 'jailcase') {
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const jailData = data.jailed[target.id];
        if (!jailData) return msg.reply({ embeds: [errEmbed('That member is not jailed.')] });
        const e = new EmbedBuilder()
            .setTitle(`📁  Jail Case — ${target.displayName}`)
            .setColor(C.JAIL)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '📝 Reason',   value: jailData.reason,              inline: false },
                { name: '🛡️ Jailed By', value: `<@${jailData.jailedBy}>`,  inline: true  },
                { name: '🕐 Since',    value: `<t:${Math.floor(new Date(jailData.timestamp).getTime() / 1000)}:R>`, inline: true },
            )
            .setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    }

    if (cmd === 'lbj') {
        const sorted = Object.entries(data.jailActions).sort(([,a],[,b]) => b - a).slice(0, 10);
        const lines  = sorted.map(([uid, n], i) => `${rank(i)} <@${uid}> — **${n}** jails`);
        const e = new EmbedBuilder()
            .setTitle('🏆  Top 10 — Jailers')
            .setColor(C.GOLD)
            .setDescription(lines.join('\n') || 'No data yet.')
            .setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    }

    // ════════════════════════════════════════════════════════════
    //  WARN
    // ════════════════════════════════════════════════════════════

    if (cmd === 'warn') {
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const reason = args.slice(1).join(' ') || 'No reason provided';
        if (!data.warns[target.id]) data.warns[target.id] = { count: 0, reasons: [] };
        data.warns[target.id].count++;
        data.warns[target.id].reasons.push({ reason, by: member.id, at: new Date().toISOString() });
        const count = data.warns[target.id].count;

        const warnRoles = [ROLES.FIRST_WARN, ROLES.SECOND_WARN, ROLES.LAST_WARN];
        for (const roleId of warnRoles) {
            const r = guild.roles.cache.get(roleId);
            if (r && target.roles.cache.has(roleId)) await target.roles.remove(r).catch(() => {});
        }
        const warnRoleMap = { 1: ROLES.FIRST_WARN, 2: ROLES.SECOND_WARN, 3: ROLES.LAST_WARN };
        if (warnRoleMap[Math.min(count, 3)]) {
            const r = guild.roles.cache.get(warnRoleMap[Math.min(count, 3)]);
            if (r) await target.roles.add(r).catch(() => {});
        }
        if (count === 3) {
            const muted = guild.roles.cache.get(ROLES.MUTED);
            if (muted) await target.roles.add(muted).catch(() => {});
        }
        if (count >= 4) await target.kick(`Auto-kick: ${count} warns`).catch(() => {});

        saveData(data);
        const e = new EmbedBuilder()
            .setAuthor({ name: member.displayName, iconURL: member.user.displayAvatarURL() })
            .setTitle(`⚠️  Warn #${count}`)
            .setColor(warnColor(count))
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 Member', value: `${target}`,          inline: true  },
                { name: '📊 Warns',  value: warnBar(count),        inline: true  },
                { name: '🛡️ By',    value: `${member}`,           inline: true  },
                { name: '📝 Reason', value: reason,                inline: false },
            )
            .setFooter(ft(client)).setTimestamp();
        await msg.reply({ embeds: [e] });
        await target.send(`⚠️ You received a **warn** in **${guild.name}**.\n📝 Reason: ${reason}\n📊 Total: ${warnBar(count)} (${count}/3)`).catch(() => {});
        return;
    }

    if (cmd === 'unwarn') {
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        if (!data.warns[target.id] || data.warns[target.id].count === 0)
            return msg.reply({ embeds: [errEmbed('That member has no warns.')] });
        data.warns[target.id].count--;
        data.warns[target.id].reasons.pop();
        const newCount = data.warns[target.id].count;
        saveData(data);
        const allWarnRoles = [ROLES.FIRST_WARN, ROLES.SECOND_WARN, ROLES.LAST_WARN, ROLES.MUTED];
        for (const roleId of allWarnRoles) {
            const r = guild.roles.cache.get(roleId);
            if (r && target.roles.cache.has(roleId)) await target.roles.remove(r).catch(() => {});
        }
        const warnRoleMap = { 1: ROLES.FIRST_WARN, 2: ROLES.SECOND_WARN, 3: ROLES.LAST_WARN };
        if (warnRoleMap[newCount]) {
            const r = guild.roles.cache.get(warnRoleMap[newCount]);
            if (r) await target.roles.add(r).catch(() => {});
        }
        const e = new EmbedBuilder()
            .setAuthor({ name: member.displayName, iconURL: member.user.displayAvatarURL() })
            .setTitle('✅  Warn Removed')
            .setColor(C.VERIF)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 Member',    value: `${target}`,      inline: true },
                { name: '📊 Remaining', value: warnBar(newCount), inline: true },
                { name: '🛡️ By',       value: `${member}`,      inline: true },
            )
            .setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    }

    if (cmd === 'warns') {
        const target   = args[0] ? await resolveUser(guild, args[0]) : member;
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const warnData = data.warns[target.id];
        if (!warnData || warnData.count === 0) {
            const e = new EmbedBuilder().setColor(C.VERIF)
                .setDescription(`✅  ${target} has **no warns**.`)
                .setFooter(ft(client));
            return msg.reply({ embeds: [e] });
        }
        const e = new EmbedBuilder()
            .setTitle(`📋  Warns — ${target.displayName}`)
            .setColor(warnColor(warnData.count))
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .setDescription(`${warnBar(warnData.count)}  **${warnData.count}/3 warns**`);
        warnData.reasons.forEach((w, i) => {
            e.addFields({ name: `Warn #${i + 1}`, value: `${w.reason}\n— by <@${w.by}> • <t:${Math.floor(new Date(w.at).getTime()/1000)}:R>`, inline: false });
        });
        e.setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    }

    // ════════════════════════════════════════════════════════════
    //  TIMEOUT
    // ════════════════════════════════════════════════════════════

    if (cmd === 'timeout') {
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target  = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const timeArg = args[1];
        if (!timeArg) return msg.reply({ embeds: [errEmbed('Usage: `+timeout @user [durée] [raison]`\nExemple: `+timeout @user 10m spam`')] });
        const match = timeArg.match(/^(\d+)(s|m|h|d)?$/i);
        if (!match) return msg.reply({ embeds: [errEmbed('Durée invalide. Ex: `30s` `10m` `1h` `1d`')] });
        const unitMap = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
        const ms = parseInt(match[1]) * unitMap[(match[2] || 'm').toLowerCase()];
        if (ms > 28 * 86_400_000) return msg.reply({ embeds: [errEmbed('Maximum: 28 jours.')] });
        const reason = args.slice(2).join(' ') || 'No reason provided';
        await target.timeout(ms, reason);
        const e = new EmbedBuilder()
            .setAuthor({ name: member.displayName, iconURL: member.user.displayAvatarURL() })
            .setTitle('⏱️  Timeout')
            .setColor(C.TIMEOUT)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 Member', value: `${target}`, inline: true  },
                { name: '⏱️ Durée',  value: timeArg,     inline: true  },
                { name: '🛡️ By',    value: `${member}`,  inline: true  },
                { name: '📝 Reason', value: reason,        inline: false },
            )
            .setFooter(ft(client)).setTimestamp();
        await msg.reply({ embeds: [e] });
        await target.send(`⏱️ You have been **timed out** in **${guild.name}** for **${timeArg}**.\n📝 Reason: ${reason}`).catch(() => {});
        return;
    }

    // ════════════════════════════════════════════════════════════
    //  VOICE
    // ════════════════════════════════════════════════════════════

    if (cmd === 'join') {
        if (!member.voice?.channel) return msg.reply({ embeds: [errEmbed('You are not in a voice channel.')] });
        const e = new EmbedBuilder().setColor(C.VOICE)
            .setDescription(`🔊  Joined **${member.voice.channel.name}**.`)
            .setFooter(ft(client));
        return msg.reply({ embeds: [e] });
    }

    if (cmd === 'vc') {
        await guild.members.fetch();
        const online  = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;
        const inVoice = guild.members.cache.filter(m => m.voice?.channel).size;
        const e = new EmbedBuilder()
            .setAuthor({ name: guild.name, iconURL: guild.iconURL({ dynamic: true }) })
            .setTitle('📊  Server Statistics')
            .setColor(C.VOICE)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: '👥 Members',  value: `\`${guild.memberCount}\``,                  inline: true },
                { name: '🟢 Online',   value: `\`${online}\``,                              inline: true },
                { name: '🔊 In Voice', value: `\`${inVoice}\``,                             inline: true },
                { name: '💬 Channels', value: `\`${guild.channels.cache.size}\``,            inline: true },
                { name: '🏷️ Roles',   value: `\`${guild.roles.cache.size}\``,              inline: true },
                { name: '🚀 Boosts',   value: `\`${guild.premiumSubscriptionCount ?? 0}\``, inline: true },
            )
            .setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    }

    if (cmd === 'aji') {
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const chId = args[1]?.replace(/[<#>]/g, '');
        const vc   = chId ? guild.channels.cache.get(chId) : member.voice?.channel;
        if (!vc) return msg.reply({ embeds: [errEmbed(chId ? 'Channel not found.' : 'You are not in a voice channel.')] });
        if (!target.voice?.channel) return msg.reply({ embeds: [errEmbed(`${target} is not in a voice channel.`)] });
        await target.voice.setChannel(vc);
        const e = new EmbedBuilder().setColor(C.VOICE)
            .setDescription(`🔊  ${target} moved to **${vc.name}**.`)
            .setFooter(ft(client));
        return msg.reply({ embeds: [e] });
    }

    if (cmd === 'vkick') {
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        if (!target.voice?.channel) return msg.reply({ embeds: [errEmbed(`${target} is not in a voice channel.`)] });
        await target.voice.setChannel(null);
        const e = new EmbedBuilder().setColor(C.JAIL)
            .setDescription(`🚫  ${target} was kicked from voice.`)
            .setFooter(ft(client));
        return msg.reply({ embeds: [e] });
    }

    if (cmd === 'ot') {
        if (!member.voice?.channel) return msg.reply({ embeds: [errEmbed('You are not in a voice channel.')] });
        const vc = guild.channels.cache.get(ONE_TAP_1);
        if (!vc) return msg.reply({ embeds: [errEmbed('One Tap 1 not found.')] });
        await member.voice.setChannel(vc);
        const e = new EmbedBuilder().setColor(C.VOICE)
            .setDescription(`🔊  ${member} moved to **One Tap 1**.`)
            .setFooter(ft(client));
        return msg.reply({ embeds: [e] });
    }

    // ════════════════════════════════════════════════════════════
    //  INFO
    // ════════════════════════════════════════════════════════════

    if (cmd === 'a') {
        const target = args[0] ? await resolveUser(guild, args[0]) : member;
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const e = new EmbedBuilder()
            .setTitle(`🖼️  ${target.displayName}'s Avatar`)
            .setImage(target.user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setColor(C.INFO)
            .setFooter(ft(client));
        return msg.reply({ embeds: [e] });
    }

    if (cmd === 'b') {
        const target = args[0] ? await resolveUser(guild, args[0]) : member;
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const user = await client.users.fetch(target.id, { force: true });
        const bannerUrl = user.bannerURL({ dynamic: true, size: 1024 });
        if (!bannerUrl) return msg.reply({ embeds: [errEmbed(`${target} has no banner.`)] });
        const e = new EmbedBuilder()
            .setTitle(`🖼️  ${target.displayName}'s Banner`)
            .setImage(bannerUrl)
            .setColor(C.INFO)
            .setFooter(ft(client));
        return msg.reply({ embeds: [e] });
    }

    if (cmd === 'user') {
        const target = args[0] ? await resolveUser(guild, args[0]) : member;
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const user  = await client.users.fetch(target.id, { force: true });
        const roles = target.roles.cache.filter(r => r.id !== guild.roles.everyone.id)
            .sort((a, b) => b.position - a.position).map(r => r.toString()).slice(0, 10).join(' ') || 'None';
        const e = new EmbedBuilder()
            .setTitle(`👤  ${target.displayName}`)
            .setColor(target.displayHexColor || C.INFO)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '🏷️ Username',      value: `\`${user.username}\``,                                inline: true  },
                { name: '🆔 ID',             value: `\`${user.id}\``,                                     inline: true  },
                { name: '📅 Joined Server',  value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`,  inline: false },
                { name: '📅 Account Created',value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,   inline: false },
                { name: `🏷️ Roles (${target.roles.cache.size - 1})`, value: roles,                        inline: false },
            )
            .setFooter(ft(client)).setTimestamp();
        if (user.bannerURL()) e.setImage(user.bannerURL({ dynamic: true }));
        return msg.reply({ embeds: [e] });
    }

    if (cmd === 'staff') {
        const target    = args[0] ? await resolveUser(guild, args[0]) : member;
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const verifDone = data.verifications[target.id] || 0;
        const jailsDone = data.jailActions[target.id]   || 0;
        const roles     = target.roles.cache.filter(r => r.id !== guild.roles.everyone.id)
            .sort((a, b) => b.position - a.position).map(r => r.toString()).slice(0, 8).join(' ') || 'None';
        const e = new EmbedBuilder()
            .setTitle(`🛡️  Staff Info — ${target.displayName}`)
            .setColor(C.GOLD)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '✅ Verifications', value: `\`${verifDone}\``, inline: true  },
                { name: '🔒 Jails Done',   value: `\`${jailsDone}\``, inline: true  },
                { name: '📅 Joined',       value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`, inline: false },
                { name: '🏷️ Roles',        value: roles,               inline: false },
            )
            .setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    }

    if (cmd === 'myinvites') {
        const invites = await guild.invites.fetch().catch(() => null);
        if (!invites) return msg.reply({ embeds: [errEmbed('Could not fetch invites.')] });
        const mine = invites.filter(inv => inv.inviterId === member.id);
        if (!mine.size) return msg.reply({ embeds: [errEmbed('You have no active invites.')] });
        const lines = mine.map(inv =>
            `\`${inv.code}\` — **${inv.uses}** uses — ${inv.expiresAt ? `<t:${Math.floor(inv.expiresAt.getTime()/1000)}:R>` : 'Never expires'}`
        );
        const e = new EmbedBuilder()
            .setTitle(`📨  Your Invites — ${member.displayName}`)
            .setColor(C.INFO)
            .setDescription(lines.join('\n'))
            .setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    }

    if (cmd === 'inviteowner') {
        const code = args[0];
        if (!code) return msg.reply({ embeds: [errEmbed('Usage: `+inviteowner <code>`')] });
        const invites = await guild.invites.fetch().catch(() => null);
        if (!invites) return msg.reply({ embeds: [errEmbed('Could not fetch invites.')] });
        const inv = invites.get(code);
        if (!inv) return msg.reply({ embeds: [errEmbed('Invite not found.')] });
        const e = new EmbedBuilder()
            .setTitle('📨  Invite Info')
            .setColor(C.INFO)
            .addFields(
                { name: '🔗 Code',    value: `\`${inv.code}\``,        inline: true },
                { name: '👤 Owner',   value: `<@${inv.inviterId}>`,    inline: true },
                { name: '📊 Uses',    value: `\`${inv.uses}\``,         inline: true },
                { name: '💬 Channel', value: `${inv.channel}`,          inline: true },
            )
            .setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    }

    // ════════════════════════════════════════════════════════════
    //  MODERATION — MESSAGES
    // ════════════════════════════════════════════════════════════

    if (cmd === 'ms7') {
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const amount = parseInt(args[0]);
        if (!args[0] || isNaN(amount) || amount < 1 || amount > 100)
            return msg.reply({ embeds: [errEmbed('Usage: `+ms7 [1-100]`')] });
        await msg.delete().catch(() => {});
        const deleted = await channel.bulkDelete(amount, true).catch(() => null);
        const count   = deleted?.size ?? 0;
        const notice  = await channel.send({
            embeds: [new EmbedBuilder().setColor(C.JAIL)
                .setDescription(`🗑️  **${count}** message(s) deleted by ${member}.`)
                .setFooter(ft(client))]
        });
        setTimeout(() => notice.delete().catch(() => {}), 4000);
        return;
    }

    // ════════════════════════════════════════════════════════════
    //  GAME MENTIONS
    // ════════════════════════════════════════════════════════════

    const gameMap = {
        pes: 'pes', among: 'amongus', amongus: 'amongus',
        ff: 'freefire', freefire: 'freefire', codenames: 'codenames',
        lol: 'lol', valo: 'valorant', valorant: 'valorant',
        plato: 'plato', mc: 'minecraft', minecraft: 'minecraft',
        stumble: 'stumbleguys', stumbleguys: 'stumbleguys',
        brawl: 'brawlhalla', brawlhalla: 'brawlhalla',
        cs: 'csgo', roblox: 'roblox', pubg: 'pubg',
        parchisi: 'parchisi', fifa: 'fifa', gta: 'gta',
        cod: 'cod', fortnite: 'fortnite', monopoly: 'monopoly',
        bloodstrike: 'bloodstrike', chess: 'chess',
    };

    if (gameMap[cmd]) {
        const gameKey = gameMap[cmd];
        const roleId  = GAME_ROLES[gameKey];
        if (!roleId || roleId === '0') return msg.reply({ embeds: [errEmbed('Game role not configured.')] });
        const coolKey   = `${channel.id}_${gameKey}`;
        const lastUsed  = gameCooldowns.get(coolKey) || 0;
        const remaining = GAME_COOLDOWN - (Date.now() - lastUsed);
        if (remaining > 0) {
            const mins = Math.ceil(remaining / 60000);
            return msg.reply({ embeds: [new EmbedBuilder().setColor(C.WARN)
                .setDescription(`⏳  Cooldown! Wait **${mins} min** before calling this game again.`)
                .setFooter(ft(client))] });
        }
        const role = guild.roles.cache.get(roleId);
        if (!role) return msg.reply({ embeds: [errEmbed('Game role not found.')] });
        gameCooldowns.set(coolKey, Date.now());
        return msg.reply(`🎮  ${role} — **${member.displayName}** is looking for players!`);
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hasStaffPerms(member) {
    if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
    if (ROLES.STAFF && ROLES.STAFF !== '0') return member.roles.cache.has(ROLES.STAFF);
    return member.permissions.has(PermissionFlagsBits.ManageMessages);
}

function hasVerifPerms(member) {
    if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
    if (ROLES.STAFF && member.roles.cache.has(ROLES.STAFF)) return true;
    if (ROLES.VERIF && member.roles.cache.has(ROLES.VERIF)) return true;
    return false;
}

async function resolveUser(guild, raw) {
    if (!raw) return null;
    const id = raw.replace(/[<@!>]/g, '');
    return guild.members.fetch(id).catch(() => null);
}

client.login(TOKEN);
