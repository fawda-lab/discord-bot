const log = require('./logger')('RankBot');

const http = require('http');
const server = http.createServer((req, res) => {
    try { res.writeHead(200); res.end('Bot is alive!'); }
    catch (e) { log.error('HTTP handler error:', e); }
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

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs   = require('fs');
const path = require('path');

const { TOKEN, PREFIX, GUILD_ID, VOICE_XP, MSG_XP_MIN, MSG_XP_MAX, MSG_COOLDOWN } = require('./utils/constants');
const { loadData, saveData, addXP } = require('./utils/dataManager');

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

// ─── Shared state ─────────────────────────────────────────────────────────────
client.voiceSessions = new Map();

// ─── Command loader ───────────────────────────────────────────────────────────
client.commands = new Collection();
fs.readdirSync(path.join(__dirname, 'commands', 'rank'))
    .filter(f => f.endsWith('.js'))
    .forEach(file => {
        const cmd = require(`./commands/rank/${file}`);
        client.commands.set(cmd.name, cmd);
        if (cmd.aliases) cmd.aliases.forEach(a => client.commands.set(a, cmd));
    });

// ─── Events ───────────────────────────────────────────────────────────────────
client.once('ready', async () => {
    log.info(`Logged in as ${client.user.tag}`);
    const guild = client.guilds.cache.get(GUILD_ID);
    if (guild) {
        await guild.members.fetch();
        guild.members.cache.forEach(m => {
            if (m.voice.channelId && !m.user.bot) client.voiceSessions.set(m.id, Date.now());
        });
    }
});

client.on('error',     (err)  => log.error('[Discord Client Error]', err));
client.on('warn',      (info) => log.warn('[Discord Client Warning]', info));
client.on('rateLimit', (info) => log.warn('[Discord Rate Limit]', info));

client.on('voiceStateUpdate', async (oldState, newState) => {
    const member = newState.member ?? oldState.member;
    if (!member || member.user.bot) return;
    const guild = newState.guild ?? oldState.guild;

    const wasIn = !!oldState.channelId;
    const isIn  = !!newState.channelId;

    if (!wasIn && isIn) {
        client.voiceSessions.set(member.id, Date.now());
    } else if (wasIn && !isIn) {
        const joinTime = client.voiceSessions.get(member.id);
        if (joinTime) {
            const minutes = Math.floor((Date.now() - joinTime) / 60_000);
            if (minutes > 0) await addXP(member.id, minutes * VOICE_XP, guild);
            client.voiceSessions.delete(member.id);
        }
    }
});

client.on('messageCreate', async (msg) => {
    if (msg.author.bot || !msg.guild || msg.guild.id !== GUILD_ID) return;

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
    const guild = client.guilds.cache.get(GUILD_ID);
    if (guild) {
        for (const [userId, joinTime] of client.voiceSessions) {
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
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

client.login(TOKEN);
