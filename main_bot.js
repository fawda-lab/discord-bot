const log = require('./logger')('MainBot');

const http = require('http');
const server = http.createServer((req, res) => {
    try { res.writeHead(200); res.end('Bot is alive!'); }
    catch (e) { log.error('HTTP handler error:', e); }
});
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        log.error(`[HTTP] Port ${process.env.PORT || 3001} is already in use.`);
        process.exit(1);
    }
    log.error('[HTTP] Server error:', err);
});
server.listen(process.env.PORT || 3001);

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

const { TOKEN, PREFIX, RAYSS_ID } = require('./utils/mainConstants');
const { HELP_PANELS, buildAllCommandsDm } = require('./utils/helpPanels');

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

    if (msg.content.includes(`<@${RAYSS_ID}>`) && fs.existsSync(RAYSS_IMG)) {
        await msg.reply({ files: [RAYSS_IMG] }).catch(e => log.debug('[DEBUG]', e.message));
    }

    if (!msg.content.startsWith(PREFIX)) return;
    const args    = msg.content.slice(PREFIX.length).trim().split(/\s+/);
    const cmd     = args.shift().toLowerCase();
    const command = client.commands.get(cmd);
    if (!command) return;

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

// ─── Graceful shutdown ────────────────────────────────────────────────────────
async function gracefulShutdown(signal) {
    log.info(`Received ${signal}, shutting down gracefully...`);
    try { client.destroy(); } catch (e) { log.debug('[DEBUG]', e.message); }
    server.close(() => process.exit(0));
}
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

client.login(TOKEN);
