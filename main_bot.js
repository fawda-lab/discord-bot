require('dotenv').config();
const log = require('./logger')('MainBot');

process.on('unhandledRejection', (reason, promise) => {
    log.error('[Anti-Crash] Unhandled Rejection at:', promise);
    log.error('[Anti-Crash] Reason:', reason?.stack ?? reason);
});
process.on('uncaughtException', (err) => {
    log.error('[Anti-Crash] Uncaught Exception:', err.message);
    log.error(err.stack);
});

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs   = require('fs');
const path = require('path');

const connectDB = require('./utils/db');
const cooldowns = require('./utils/cooldownManager');
const antiSpam  = require('./utils/antiSpam');
const { TOKEN, PREFIX, RAYSS_ID, C, LOG_CHANNELS } = require('./utils/mainConstants');
const { HELP_PANELS, buildAllCommandsDm } = require('./utils/helpPanels');

// ─── Client ───────────────────────────────────────────────────────────────────
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.MessageContent,
    ],
});

// ─── Shared state ─────────────────────────────────────────────────────────────
client.gameCooldowns = new Map();

// ─── Command loader (recursive) ───────────────────────────────────────────────
client.commands = new Collection();
function loadCommands(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            loadCommands(path.join(dir, entry.name));
        } else if (entry.name.endsWith('.js')) {
            const cmd = require(path.join(dir, entry.name));
            client.commands.set(cmd.name, cmd);
            if (cmd.aliases) cmd.aliases.forEach(a => client.commands.set(a, cmd));
        }
    }
}
loadCommands(path.join(__dirname, 'commands', 'main'));

// ─── Events ───────────────────────────────────────────────────────────────────
client.on('ready',     () => log.info(`Logged in as ${client.user.tag}`));
client.on('error',     (err)  => log.error('[Discord Client Error]', err));
client.on('warn',      (info) => log.warn('[Discord Client Warning]', info));
client.on('rateLimit', (info) => log.warn('[Discord Rate Limit]', info));

client.on('interactionCreate', async (interaction) => {
    try {
        if (!interaction.isButton()) return;
        if (interaction.customId === 'help_dm') {
            try {
                await interaction.user.send(buildAllCommandsDm(interaction.guild));
                await interaction.reply({ content: '📨 Commands sent to your DMs!', ephemeral: true });
            } catch {
                await interaction.reply({ content: "❌ Couldn't DM you. Check your privacy settings.", ephemeral: true });
            }
            return;
        }
        const builder = HELP_PANELS[interaction.customId];
        if (builder) await interaction.reply({ embeds: [builder()], ephemeral: true });
    } catch (error) {
        log.error('[Interaction Error]', error);
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: '❌ An error occurred. Please try again later.', ephemeral: true });
            } else {
                await interaction.reply({ content: '❌ An error occurred. Please try again later.', ephemeral: true });
            }
        } catch (e) { log.error('Failed to send interaction error message:', e); }
    }
});

const RAYSS_IMG = path.join(__dirname, 'rayss.jpg');
client.on('messageCreate', async (msg) => {
    if (msg.author.bot || !msg.guild) return;
    await antiSpam.check(msg.member);

    if (msg.content.includes(`<@${RAYSS_ID}>`) && fs.existsSync(RAYSS_IMG)) {
        await msg.reply({ files: [RAYSS_IMG] }).catch(e => log.debug('[DEBUG]', e.message));
    }

    if (!msg.content.startsWith(PREFIX)) return;
    const args    = msg.content.slice(PREFIX.length).trim().split(/\s+/);
    const cmd     = args.shift().toLowerCase();
    const command = client.commands.get(cmd);
    if (!command) return;

    if (command.cooldown) {
        const { onCooldown, remainingSeconds } = cooldowns.check(msg.author.id, cmd, command.cooldown);
        if (onCooldown) {
            const notice = await msg.reply(`⏱️ Please wait **${remainingSeconds}s** before using this command again.`);
            setTimeout(() => notice.delete().catch(() => {}), 4000);
            return;
        }
        cooldowns.set(msg.author.id, cmd, command.cooldown);
    }

    try {
        await command.execute(msg, args, client);
    } catch (e) {
        log.error(
            `[Command Error] cmd=${cmd} user=${msg.author.tag} (${msg.author.id}) ` +
            `args=${JSON.stringify(args)} guild=${msg.guild?.name} (${msg.guild?.id})\n` +
            (e.stack ?? e)
        );
        msg.reply('❌ An error occurred.').catch(e => log.debug('[DEBUG]', e.message));
    }
});

// ─── Ban / Unban logs ─────────────────────────────────────────────────────────
const { EmbedBuilder } = require('discord.js');

client.on('guildBanAdd', async (ban) => {
    try {
        const { guild, user, reason } = ban;
        const executor = await guild.fetchAuditLogs({ type: 22, limit: 1 })
            .then(a => a.entries.first()?.executor).catch(() => null);
        if (executor?.id === client.user.id) return;
        const e = new EmbedBuilder()
            .setTitle('🔨  Member Banned')
            .setColor(0xED4245)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 User',    value: `${user.tag} (${user.id})`, inline: true  },
                { name: '🛡️ By',     value: executor ? `${executor.tag}` : 'Unknown',  inline: true  },
                { name: '📝 Reason', value: reason ?? 'No reason provided',             inline: false },
            )
            .setTimestamp();
        const logCh = await guild.channels.fetch(LOG_CHANNELS.BAN).catch(() => null);
        if (logCh) await logCh.send({ embeds: [e] }).catch(e => log.error('[BanLog]', e.message));
    } catch (e) { log.error('[guildBanAdd]', e.message); }
});

client.on('guildBanRemove', async (ban) => {
    try {
        const { guild, user } = ban;
        const executor = await guild.fetchAuditLogs({ type: 23, limit: 1 })
            .then(a => a.entries.first()?.executor).catch(() => null);
        const e = new EmbedBuilder()
            .setTitle('✅  Member Unbanned')
            .setColor(0x57F287)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 User', value: `${user.tag} (${user.id})`, inline: true },
                { name: '🛡️ By',  value: executor ? `${executor.tag}` : 'Unknown',  inline: true },
            )
            .setTimestamp();
        const logCh = await guild.channels.fetch(LOG_CHANNELS.UNBAN).catch(() => null);
        if (logCh) await logCh.send({ embeds: [e] }).catch(e => log.error('[UnbanLog]', e.message));
    } catch (e) { log.error('[guildBanRemove]', e.message); }
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
async function gracefulShutdown(signal) {
    log.info(`Received ${signal}, shutting down gracefully...`);
    try { client.destroy(); } catch (e) { log.debug('[DEBUG]', e.message); }
    process.exit(0);
}
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

connectDB().then(() => client.login(TOKEN));
