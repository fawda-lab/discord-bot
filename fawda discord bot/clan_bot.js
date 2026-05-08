const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');

// ─── Config ───────────────────────────────────────────────────────────────────
const TOKEN             = 'YOUR_BOT_TOKEN_HERE';
const DEFAULT_PREFIX    = '&';
const DATA_FILE         = 'clans_data.json';
const CLAN_MANAGER_ROLE = 1487864572663828512n; // Clan Manager
const CLAN_OF_WEEK_ROLE = 1489995713201836147n;  // Clan of The Week
const DELAY             = 500; // ms between API calls in loops

// ─── Data ─────────────────────────────────────────────────────────────────────
function loadData() {
    if (!fs.existsSync(DATA_FILE)) return { clans: {}, members: {}, prefixes: {} };
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}
function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getPrefix(guildId) {
    return loadData().prefixes[guildId] || DEFAULT_PREFIX;
}
function getUserClan(data, guildId, userId) {
    for (const [cid, clan] of Object.entries(data.clans)) {
        if (clan.guild_id !== guildId) continue;
        if (clan.leader === userId || clan.coleaders.includes(userId) || clan.members.includes(userId))
            return [cid, clan];
    }
    return [null, null];
}
function getClanByLeader(data, guildId, userId) {
    for (const [cid, clan] of Object.entries(data.clans)) {
        if (clan.guild_id === guildId && clan.leader === userId) return [cid, clan];
    }
    return [null, null];
}
function isLeaderOrColeader(clan, userId) {
    return clan.leader === userId || clan.coleaders.includes(userId);
}
function isClanManager(member) {
    if (CLAN_MANAGER_ROLE) return member.roles.cache.has(String(CLAN_MANAGER_ROLE));
    return member.permissions.has(PermissionFlagsBits.Administrator);
}
function generateId(data) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id;
    do { id = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''); }
    while (data.clans[id]);
    return id;
}

// ─── Client ───────────────────────────────────────────────────────────────────
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

client.on('ready', () => console.log(`[Clan Bot] Logged in as ${client.user.tag}`));

// ─── Voice time tracking ──────────────────────────────────────────────────────
client.on('voiceStateUpdate', (oldState, newState) => {
    const data = loadData();
    const uid = newState.member?.id || oldState.member?.id;
    const gid = newState.guild?.id || oldState.guild?.id;
    if (!uid || !gid) return;
    const key = `${gid}_${uid}`;
    if (!data.members[key]) data.members[key] = { join_ts: null, seconds: 0, points: 0 };
    const now = Math.floor(Date.now() / 1000);
    if (newState.channel && !oldState.channel) {
        data.members[key].join_ts = now;
    } else if (!newState.channel && oldState.channel) {
        const ts = data.members[key].join_ts;
        if (ts) {
            data.members[key].seconds = (data.members[key].seconds || 0) + (now - ts);
            data.members[key].join_ts = null;
        }
    }
    saveData(data);
});

// ─── Command router ───────────────────────────────────────────────────────────
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    const prefix = getPrefix(message.guild.id);
    if (!message.content.startsWith(prefix)) return;
    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const cmd  = args.shift().toLowerCase();
    try { await handleCommand(message, cmd, args); }
    catch (err) { if (err.code !== 10008) console.error(err); }
});

async function handleCommand(msg, cmd, args) {
    const { guild, member, channel } = msg;

    // ── General ────────────────────────────────────────────────────────────────
    if (cmd === 'setprefix') {
        if (!member.permissions.has(PermissionFlagsBits.Administrator))
            return msg.reply('Administrator only.');
        const np = args[0];
        if (!np) return msg.reply('Usage: `&setprefix <prefix>`');
        const data = loadData();
        data.prefixes[guild.id] = np;
        saveData(data);
        return msg.reply(`Prefix changed to \`${np}\``);
    }

    if (cmd === 'help-setup') {
        const e = new EmbedBuilder().setTitle('FAWDA Clans Bot – Setup Help').setColor(0xe74c3c)
            .addFields(
                { name: 'Create a clan',    value: '`&create [leader] [name]`',       inline: false },
                { name: 'Setup clan chat',  value: '`&chat [clanID] [#channel]`',     inline: false },
                { name: 'Setup clan voice', value: '`&voice [clanID] [#channel]`',    inline: false },
                { name: 'Update clan role', value: '`&updaterole [clanID] [@role]`',  inline: false },
                { name: 'Change prefix',    value: '`&setprefix [prefix]`',           inline: false },
            ).setFooter({ text: 'Use &help for full command list' });
        return msg.reply({ embeds: [e] });
    }

    if (cmd === 'help') {
        const prefix = getPrefix(guild.id);
        const e = new EmbedBuilder()
            .setTitle('FAWDA Clans Bot')
            .setDescription(`Prefix: \`${prefix}\` / Use \`${prefix}setprefix\` to change it`)
            .setColor(0xe74c3c)
            .addFields(
                { name: 'Clan Leader',  value: '`adduser` `removeuser` `addcol` `removecol`\n`moveclan` `nick` `setup icon/banner/color`\n`clanrole` `set-owner` `tag` `settag` `annc`', inline: false },
                { name: 'Member',       value: '`leave` `info` `myclan` `list` `clanlist` `mypoints` `mytime`', inline: false },
                { name: 'Clan Manager', value: '`create` `delete` `voice` `chat` `forceaddusers`\n`clan-of-the-week` `giveclan` `renameclan` `updaterole`\n`update-members-limit` `update-coleaders-limit`\n`clearcoleaders` `resetpoints` `restoreclan` `clancheck`', inline: false },
            );
        return msg.reply({ embeds: [e] });
    }

    // ── Clan Manager commands ──────────────────────────────────────────────────
    if (cmd === 'create') {
        if (!isClanManager(member)) return msg.reply('No permission.');
        const leaderId = args[0]?.replace(/[<@!>]/g, '');
        const name = args.slice(1).join(' ');
        if (!leaderId || !name) return msg.reply('Usage: `&create <@leader> <name>`');
        const leader = await guild.members.fetch(leaderId).catch(() => null);
        if (!leader) return msg.reply('Member not found.');
        const data = loadData();
        const [existing] = getClanByLeader(data, guild.id, leaderId);
        if (existing) return msg.reply(`${leader} already leads a clan.`);
        const id = generateId(data);
        data.clans[id] = {
            guild_id: guild.id, name, leader: leaderId,
            coleaders: [], members: [], tag: '', icon: '', banner: '',
            color: 0xe74c3c, role_id: null, voice_id: null, chat_id: null,
            members_limit: 20, coleaders_limit: 5,
            created_at: new Date().toISOString(),
        };
        saveData(data);
        const e = new EmbedBuilder().setTitle('Clan Created').setColor(0x2ecc71)
            .addFields({ name: 'Clan ID', value: id }, { name: 'Name', value: name }, { name: 'Leader', value: `${leader}` });
        return msg.reply({ embeds: [e] });
    }

    if (cmd === 'delete') {
        if (!isClanManager(member)) return msg.reply('No permission.');
        const leaderId = args[0]?.replace(/[<@!>]/g, '');
        if (!leaderId) return msg.reply('Usage: `&delete <@leader>`');
        const data = loadData();
        const [cid, clan] = getClanByLeader(data, guild.id, leaderId);
        if (!cid) return msg.reply('No clan found for that leader.');
        delete data.clans[cid];
        saveData(data);
        return msg.reply(`Clan **${clan.name}** (\`${cid}\`) deleted.`);
    }

    if (cmd === 'voice') {
        if (!isClanManager(member)) return msg.reply('No permission.');
        const [clanId, channelId] = args;
        if (!clanId || !channelId) return msg.reply('Usage: `&voice <clanID> <#channel>`');
        const chId = channelId.replace(/[<#>]/g, '');
        const data = loadData();
        if (!data.clans[clanId] || data.clans[clanId].guild_id !== guild.id) return msg.reply('Clan not found.');
        data.clans[clanId].voice_id = chId;
        saveData(data);
        return msg.reply(`Voice channel for \`${clanId}\` set to <#${chId}>`);
    }

    if (cmd === 'chat') {
        if (!isClanManager(member)) return msg.reply('No permission.');
        const [clanId, channelId] = args;
        if (!clanId || !channelId) return msg.reply('Usage: `&chat <clanID> <#channel>`');
        const chId = channelId.replace(/[<#>]/g, '');
        const data = loadData();
        if (!data.clans[clanId] || data.clans[clanId].guild_id !== guild.id) return msg.reply('Clan not found.');
        data.clans[clanId].chat_id = chId;
        saveData(data);
        return msg.reply(`Chat channel for \`${clanId}\` set to <#${chId}>`);
    }

    if (cmd === 'forceaddusers') {
        if (!isClanManager(member)) return msg.reply('No permission.');
        const [clanId, roleId] = args;
        if (!clanId || !roleId) return msg.reply('Usage: `&forceaddusers <clanID> <@role>`');
        const rid = roleId.replace(/[<@&>]/g, '');
        const data = loadData();
        if (!data.clans[clanId] || data.clans[clanId].guild_id !== guild.id) return msg.reply('Clan not found.');
        const role = guild.roles.cache.get(rid);
        if (!role) return msg.reply('Role not found.');
        const clan = data.clans[clanId];
        let added = 0;
        for (const m of role.members.values()) {
            const uid = m.id;
            if (uid !== clan.leader && !clan.coleaders.includes(uid) && !clan.members.includes(uid)) {
                if (clan.members.length < (clan.members_limit || 20)) {
                    clan.members.push(uid);
                    added++;
                }
                await sleep(DELAY);
            }
        }
        saveData(data);
        return msg.reply(`Added **${added}** members from ${role} to clan \`${clanId}\`.`);
    }

    if (cmd === 'clan-of-the-week') {
        if (!isClanManager(member)) return msg.reply('No permission.');
        const clanId = args[0];
        if (!clanId) return msg.reply('Usage: `&clan-of-the-week <clanID>`');
        if (!CLAN_OF_WEEK_ROLE) return msg.reply('CLAN_OF_WEEK_ROLE not configured.');
        const data = loadData();
        if (!data.clans[clanId] || data.clans[clanId].guild_id !== guild.id) return msg.reply('Clan not found.');
        const role = guild.roles.cache.get(String(CLAN_OF_WEEK_ROLE));
        if (!role) return msg.reply('Clan of the week role not found.');
        const clan = data.clans[clanId];
        const allIds = [clan.leader, ...clan.coleaders, ...clan.members];
        let given = 0;
        for (const uid of allIds) {
            const m = await guild.members.fetch(uid).catch(() => null);
            if (m && !m.roles.cache.has(role.id)) {
                await m.roles.add(role).catch(() => {});
                given++;
                await sleep(DELAY);
            }
        }
        return msg.reply(`Gave Clan of the Week role to **${given}** members.`);
    }

    if (cmd === 'giveclan') {
        if (!isClanManager(member)) return msg.reply('No permission.');
        const [clanId, newLeaderId] = args;
        if (!clanId || !newLeaderId) return msg.reply('Usage: `&giveclan <clanID> <@newLeader>`');
        const nid = newLeaderId.replace(/[<@!>]/g, '');
        const data = loadData();
        if (!data.clans[clanId] || data.clans[clanId].guild_id !== guild.id) return msg.reply('Clan not found.');
        data.clans[clanId].leader = nid;
        saveData(data);
        return msg.reply(`Clan \`${clanId}\` transferred to <@${nid}>.`);
    }

    if (cmd === 'renameclan') {
        if (!isClanManager(member)) return msg.reply('No permission.');
        const clanId = args[0];
        const name = args.slice(1).join(' ');
        if (!clanId || !name) return msg.reply('Usage: `&renameclan <clanID> <name>`');
        const data = loadData();
        if (!data.clans[clanId] || data.clans[clanId].guild_id !== guild.id) return msg.reply('Clan not found.');
        data.clans[clanId].name = name;
        saveData(data);
        return msg.reply(`Clan \`${clanId}\` renamed to **${name}**.`);
    }

    if (cmd === 'updaterole') {
        if (!isClanManager(member)) return msg.reply('No permission.');
        const [clanId, roleRaw] = args;
        if (!clanId || !roleRaw) return msg.reply('Usage: `&updaterole <clanID> <@role>`');
        const rid = roleRaw.replace(/[<@&>]/g, '');
        const data = loadData();
        if (!data.clans[clanId] || data.clans[clanId].guild_id !== guild.id) return msg.reply('Clan not found.');
        data.clans[clanId].role_id = rid;
        saveData(data);
        return msg.reply(`Role for clan \`${clanId}\` set to <@&${rid}>.`);
    }

    if (cmd === 'update-members-limit') {
        if (!isClanManager(member)) return msg.reply('No permission.');
        const [clanId, num] = args;
        if (!clanId || !num) return msg.reply('Usage: `&update-members-limit <clanID> <number>`');
        const data = loadData();
        if (!data.clans[clanId] || data.clans[clanId].guild_id !== guild.id) return msg.reply('Clan not found.');
        data.clans[clanId].members_limit = parseInt(num);
        saveData(data);
        return msg.reply(`Members limit for \`${clanId}\` set to **${num}**.`);
    }

    if (cmd === 'update-coleaders-limit') {
        if (!isClanManager(member)) return msg.reply('No permission.');
        const [clanId, num] = args;
        if (!clanId || !num) return msg.reply('Usage: `&update-coleaders-limit <clanID> <number>`');
        const data = loadData();
        if (!data.clans[clanId] || data.clans[clanId].guild_id !== guild.id) return msg.reply('Clan not found.');
        data.clans[clanId].coleaders_limit = parseInt(num);
        saveData(data);
        return msg.reply(`Co-leaders limit for \`${clanId}\` set to **${num}**.`);
    }

    if (cmd === 'clearcoleaders') {
        if (!isClanManager(member)) return msg.reply('No permission.');
        const data = loadData();
        let total = 0;
        for (const clan of Object.values(data.clans)) {
            if (clan.guild_id !== guild.id) continue;
            const before = clan.coleaders.length;
            clan.coleaders = clan.coleaders.filter(uid => guild.members.cache.has(uid));
            total += before - clan.coleaders.length;
        }
        saveData(data);
        return msg.reply(`Removed **${total}** co-leaders no longer in the server.`);
    }

    if (cmd === 'resetpoints') {
        if (!isClanManager(member)) return msg.reply('No permission.');
        const data = loadData();
        for (const key of Object.keys(data.members)) {
            if (key.startsWith(`${guild.id}_`)) {
                data.members[key].seconds = 0;
                data.members[key].points  = 0;
                data.members[key].join_ts = null;
            }
        }
        saveData(data);
        return msg.reply('All member time/points reset.');
    }

    if (cmd === 'restoreclan') {
        if (!isClanManager(member)) return msg.reply('No permission.');
        const data = loadData();
        let restored = 0;
        for (const clan of Object.values(data.clans)) {
            if (clan.guild_id !== guild.id || !clan.role_id) continue;
            const role = guild.roles.cache.get(clan.role_id);
            if (!role) continue;
            const allIds = [clan.leader, ...clan.coleaders, ...clan.members];
            for (const uid of allIds) {
                const m = guild.members.cache.get(uid);
                if (m && !m.roles.cache.has(role.id)) {
                    await m.roles.add(role).catch(() => {});
                    restored++;
                    await sleep(DELAY);
                }
            }
        }
        return msg.reply(`Restored clan roles for **${restored}** members.`);
    }

    if (cmd === 'clancheck') {
        if (!isClanManager(member)) return msg.reply('No permission.');
        const data = loadData();
        const clans = Object.entries(data.clans).filter(([, c]) => c.guild_id === guild.id);
        const e = new EmbedBuilder().setTitle('Clan Management Overview').setColor(0xe74c3c);
        for (const [cid, clan] of clans) {
            const leader = guild.members.cache.get(clan.leader);
            const role   = clan.role_id ? guild.roles.cache.get(clan.role_id) : null;
            e.addFields({
                name: `${clan.name} (\`${cid}\`)`,
                value: `Leader: ${leader ? leader : clan.leader}\nMembers: ${clan.members.length}/${clan.members_limit || 20}\nCo-leaders: ${clan.coleaders.length}/${clan.coleaders_limit || 5}\nRole: ${role ? role : 'None'}`,
                inline: false,
            });
        }
        if (!clans.length) e.setDescription('No clans found.');
        return msg.reply({ embeds: [e] });
    }

    // ── Clan Leader commands ───────────────────────────────────────────────────
    if (cmd === 'adduser') {
        const data = loadData();
        const [cid, clan] = getUserClan(data, guild.id, member.id);
        if (!cid) return msg.reply('You are not in any clan.');
        if (!isLeaderOrColeader(clan, member.id)) return msg.reply('Only leaders/co-leaders can use this.');
        const uid = args[0]?.replace(/[<@!>]/g, '');
        if (!uid) return msg.reply('Usage: `&adduser <@member>`');
        const [existing] = getUserClan(data, guild.id, uid);
        if (existing) return msg.reply('That member is already in a clan.');
        if (clan.members.length >= (clan.members_limit || 20)) return msg.reply('Your clan is full.');
        clan.members.push(uid);
        if (clan.role_id) {
            const m = guild.members.cache.get(uid);
            const r = guild.roles.cache.get(clan.role_id);
            if (m && r) await m.roles.add(r).catch(() => {});
        }
        saveData(data);
        return msg.reply(`<@${uid}> added to **${clan.name}**.`);
    }

    if (cmd === 'removeuser') {
        const data = loadData();
        const [cid, clan] = getUserClan(data, guild.id, member.id);
        if (!cid) return msg.reply('You are not in any clan.');
        if (!isLeaderOrColeader(clan, member.id)) return msg.reply('Only leaders/co-leaders can use this.');
        const uid = args[0]?.replace(/[<@!>]/g, '');
        if (!uid) return msg.reply('Usage: `&removeuser <@member>`');
        if (!clan.members.includes(uid)) return msg.reply('That member is not in your clan.');
        clan.members = clan.members.filter(id => id !== uid);
        if (clan.role_id) {
            const m = guild.members.cache.get(uid);
            const r = guild.roles.cache.get(clan.role_id);
            if (m && r && m.roles.cache.has(r.id)) await m.roles.remove(r).catch(() => {});
        }
        saveData(data);
        return msg.reply(`<@${uid}> removed from **${clan.name}**.`);
    }

    if (cmd === 'addcol') {
        const data = loadData();
        const [cid, clan] = getClanByLeader(data, guild.id, member.id);
        if (!cid) return msg.reply('Only the clan leader can add co-leaders.');
        const uid = args[0]?.replace(/[<@!>]/g, '');
        if (!uid) return msg.reply('Usage: `&addcol <@member>`');
        if (clan.coleaders.includes(uid)) return msg.reply('Already a co-leader.');
        if (clan.coleaders.length >= (clan.coleaders_limit || 5)) return msg.reply('Co-leader slots are full.');
        clan.members = clan.members.filter(id => id !== uid);
        clan.coleaders.push(uid);
        saveData(data);
        return msg.reply(`<@${uid}> is now a co-leader of **${clan.name}**.`);
    }

    if (cmd === 'removecol') {
        const data = loadData();
        const [cid, clan] = getClanByLeader(data, guild.id, member.id);
        if (!cid) return msg.reply('Only the clan leader can remove co-leaders.');
        const uid = args[0]?.replace(/[<@!>]/g, '');
        if (!uid) return msg.reply('Usage: `&removecol <@member>`');
        if (!clan.coleaders.includes(uid)) return msg.reply('That member is not a co-leader.');
        clan.coleaders = clan.coleaders.filter(id => id !== uid);
        clan.members.push(uid);
        saveData(data);
        return msg.reply(`<@${uid}> is no longer a co-leader.`);
    }

    if (cmd === 'moveclan') {
        const data = loadData();
        const [cid, clan] = getUserClan(data, guild.id, member.id);
        if (!cid) return msg.reply('You are not in any clan.');
        if (!isLeaderOrColeader(clan, member.id)) return msg.reply('Only leaders/co-leaders can use this.');
        const chId = args[0] ? args[0].replace(/[<#>]/g, '') : clan.voice_id;
        if (!chId) return msg.reply('No clan voice channel set. Use `&voice <clanID> <#channel>`.');
        const vc = guild.channels.cache.get(chId);
        if (!vc) return msg.reply('Voice channel not found.');
        const allIds = new Set([clan.leader, ...clan.coleaders, ...clan.members]);
        let moved = 0;
        for (const uid of allIds) {
            const m = guild.members.cache.get(uid);
            if (m?.voice?.channel) {
                await m.voice.setChannel(vc).catch(() => {});
                moved++;
                await sleep(DELAY);
            }
        }
        return msg.reply(`Moved **${moved}** clan members to ${vc}.`);
    }

    if (cmd === 'nick') {
        const data = loadData();
        const [cid, clan] = getUserClan(data, guild.id, member.id);
        if (!cid) return msg.reply('You are not in any clan.');
        if (!isLeaderOrColeader(clan, member.id)) return msg.reply('Only leaders/co-leaders can use this.');
        const uid = args[0]?.replace(/[<@!>]/g, '');
        const nick = args.slice(1).join(' ');
        if (!uid || !nick) return msg.reply('Usage: `&nick <@member> <nickname>`');
        const target = guild.members.cache.get(uid);
        if (!target) return msg.reply('Member not found.');
        await target.setNickname(nick).catch(() => msg.reply('No permission to change that nickname.'));
        return msg.reply(`Nickname updated for ${target}.`);
    }

    if (cmd === 'setup') {
        const data = loadData();
        const [cid, clan] = getUserClan(data, guild.id, member.id);
        if (!cid || !isLeaderOrColeader(clan, member.id)) return msg.reply('Only leaders/co-leaders can use setup commands.');
        const option = args[0]?.toLowerCase();
        const value  = args.slice(1).join(' ');
        if (option === 'icon') {
            clan.icon = value;
            saveData(data);
            const e = new EmbedBuilder().setTitle(`${clan.name} – Icon Updated`).setColor(clan.color || 0xe74c3c).setThumbnail(value);
            return msg.reply({ embeds: [e] });
        } else if (option === 'banner') {
            clan.banner = value;
            saveData(data);
            const e = new EmbedBuilder().setTitle(`${clan.name} – Banner Updated`).setColor(clan.color || 0xe74c3c).setImage(value);
            return msg.reply({ embeds: [e] });
        } else if (option === 'color') {
            const colorInt = parseInt(value.replace('#', ''), 16);
            if (isNaN(colorInt)) return msg.reply('Invalid color. Use hex like `#FF0000`.');
            clan.color = colorInt;
            saveData(data);
            return msg.reply(`Clan color updated to \`#${value.replace('#', '').toUpperCase()}\`.`);
        } else {
            return msg.reply('Use `setup icon`, `setup banner`, or `setup color`.');
        }
    }

    if (cmd === 'clanrole') {
        const data = loadData();
        const [, clan] = getUserClan(data, guild.id, member.id);
        if (!clan) return msg.reply('You are not in any clan.');
        if (!clan.role_id) return msg.reply('No role configured for your clan.');
        return msg.reply(`Clan role: <@&${clan.role_id}>`);
    }

    if (cmd === 'set-owner') {
        const data = loadData();
        const [cid, clan] = getClanByLeader(data, guild.id, member.id);
        if (!cid) return msg.reply('Only the current clan leader can transfer ownership.');
        const uid = args[0]?.replace(/[<@!>]/g, '');
        if (!uid) return msg.reply('Usage: `&set-owner <@member>`');
        clan.leader = uid;
        clan.coleaders = clan.coleaders.filter(id => id !== uid);
        if (!clan.coleaders.includes(member.id)) clan.coleaders.push(member.id);
        saveData(data);
        return msg.reply(`Clan ownership transferred to <@${uid}>.`);
    }

    if (cmd === 'tag') {
        const data = loadData();
        const [cid, clan] = getUserClan(data, guild.id, member.id);
        if (!cid || !isLeaderOrColeader(clan, member.id)) return msg.reply('Only leaders/co-leaders can use this.');
        const uid = args[0]?.replace(/[<@!>]/g, '');
        if (!uid) return msg.reply('Usage: `&tag <@member>`');
        if (!clan.tag) return msg.reply('No tag set. Use `&settag <tag>` first.');
        const target = guild.members.cache.get(uid);
        if (!target) return msg.reply('Member not found.');
        if (!target.displayName.includes(clan.tag)) {
            await target.setNickname(`[${clan.tag}] ${target.displayName}`).catch(() => {});
            return msg.reply(`Tag \`[${clan.tag}]\` added to ${target}.`);
        }
        return msg.reply(`${target} already has the clan tag.`);
    }

    if (cmd === 'settag') {
        const data = loadData();
        const [cid, clan] = getUserClan(data, guild.id, member.id);
        if (!cid || !isLeaderOrColeader(clan, member.id)) return msg.reply('Only leaders/co-leaders can use this.');
        const tag = args.join(' ');
        if (!tag) return msg.reply('Usage: `&settag <tag>`');
        clan.tag = tag;
        saveData(data);
        return msg.reply(`Clan tag set to \`${tag}\`.`);
    }

    if (cmd === 'annc') {
        const data = loadData();
        const [cid, clan] = getUserClan(data, guild.id, member.id);
        if (!cid || !isLeaderOrColeader(clan, member.id)) return msg.reply('Only leaders/co-leaders can use this.');
        if (!clan.chat_id) return msg.reply('No clan chat channel configured.');
        const ch = guild.channels.cache.get(clan.chat_id);
        if (!ch) return msg.reply('Clan chat channel not found.');
        const text = args.join(' ');
        if (!text) return msg.reply('Usage: `&annc <message>`');
        const e = new EmbedBuilder()
            .setTitle(`📢 Announcement – ${clan.name}`)
            .setDescription(text)
            .setColor(clan.color || 0xe74c3c)
            .setFooter({ text: `By ${member.displayName}` });
        const mention = clan.role_id ? `<@&${clan.role_id}>` : '';
        await ch.send({ content: mention, embeds: [e] });
        return msg.reply(`Announcement sent to ${ch}.`);
    }

    // ── Member commands ────────────────────────────────────────────────────────
    if (cmd === 'leave') {
        const data = loadData();
        const [cid, clan] = getUserClan(data, guild.id, member.id);
        if (!cid) return msg.reply('You are not in any clan.');
        if (clan.leader === member.id) return msg.reply('Transfer ownership first with `&set-owner`.');
        clan.coleaders = clan.coleaders.filter(id => id !== member.id);
        clan.members   = clan.members.filter(id => id !== member.id);
        if (clan.role_id) {
            const r = guild.roles.cache.get(clan.role_id);
            if (r && member.roles.cache.has(r.id)) await member.roles.remove(r).catch(() => {});
        }
        saveData(data);
        return msg.reply(`You have left **${clan.name}**.`);
    }

    if (cmd === 'info' || cmd === 'myclan') {
        const data = loadData();
        let cid, clan;
        if (cmd === 'info' && args[0]) {
            cid = args[0];
            clan = data.clans[cid];
            if (!clan || clan.guild_id !== guild.id) return msg.reply('Clan not found.');
        } else {
            [cid, clan] = getUserClan(data, guild.id, member.id);
            if (!cid) return msg.reply('You are not in any clan.');
        }
        const leader = guild.members.cache.get(clan.leader);
        const e = new EmbedBuilder().setTitle(clan.name).setDescription(`ID: \`${cid}\``).setColor(clan.color || 0xe74c3c)
            .addFields(
                { name: 'Leader',     value: leader ? `${leader}` : clan.leader, inline: true },
                { name: 'Co-leaders', value: String(clan.coleaders.length),       inline: true },
                { name: 'Members',    value: `${clan.members.length}/${clan.members_limit || 20}`, inline: true },
            );
        if (clan.tag)    e.addFields({ name: 'Tag',  value: clan.tag,                 inline: true });
        if (clan.role_id) e.addFields({ name: 'Role', value: `<@&${clan.role_id}>`, inline: true });
        if (clan.icon)   e.setThumbnail(clan.icon);
        if (clan.banner) e.setImage(clan.banner);
        return msg.reply({ embeds: [e] });
    }

    if (cmd === 'list') {
        const data = loadData();
        const clans = Object.entries(data.clans).filter(([, c]) => c.guild_id === guild.id);
        if (!clans.length) return msg.reply('No clans on this server.');
        const e = new EmbedBuilder().setTitle('All Clans').setColor(0xe74c3c);
        for (const [cid, clan] of clans) {
            const total = 1 + clan.coleaders.length + clan.members.length;
            e.addFields({ name: `${clan.name} (\`${cid}\`)`, value: `Members: ${total}`, inline: true });
        }
        return msg.reply({ embeds: [e] });
    }

    if (cmd === 'clanlist') {
        const data = loadData();
        let cid, clan;
        if (args[0]) {
            cid = args[0]; clan = data.clans[cid];
            if (!clan || clan.guild_id !== guild.id) return msg.reply('Clan not found.');
        } else {
            [cid, clan] = getUserClan(data, guild.id, member.id);
            if (!cid) return msg.reply('You are not in any clan.');
        }
        const leader = guild.members.cache.get(clan.leader);
        const e = new EmbedBuilder().setTitle(`${clan.name} – Member List`).setColor(clan.color || 0xe74c3c)
            .addFields(
                { name: '👑 Leader',     value: leader ? `${leader}` : clan.leader,                                                       inline: false },
                { name: '⭐ Co-leaders', value: clan.coleaders.map(id => `<@${id}>`).join('\n') || 'None',                               inline: false },
                { name: '👤 Members',   value: clan.members.map(id => `<@${id}>`).join('\n') || 'None',                                  inline: false },
            );
        return msg.reply({ embeds: [e] });
    }

    if (cmd === 'mypoints') {
        const data = loadData();
        const entry = data.members[`${guild.id}_${member.id}`] || {};
        const secs  = entry.seconds || 0;
        const h = Math.floor(secs / 3600), r = secs % 3600, m2 = Math.floor(r / 60), s = r % 60;
        const e = new EmbedBuilder().setTitle(`${member.displayName} – Points`).setColor(0xe74c3c)
            .addFields({ name: 'Points', value: String(entry.points || 0) }, { name: 'Time in Voice', value: `${h}h ${m2}m ${s}s` });
        return msg.reply({ embeds: [e] });
    }

    if (cmd === 'mytime') {
        const data = loadData();
        const secs = data.members[`${guild.id}_${member.id}`]?.seconds || 0;
        const h = Math.floor(secs / 3600), r = secs % 3600, m2 = Math.floor(r / 60), s = r % 60;
        const e = new EmbedBuilder().setTitle(`${member.displayName} – Time Spent`)
            .setDescription(`**${h}h ${m2}m ${s}s** in voice channels`).setColor(0xe74c3c);
        return msg.reply({ embeds: [e] });
    }
}

client.login(TOKEN);
