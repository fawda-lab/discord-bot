const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { C } = require('./mainConstants');

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
            '`!vb [@user]` — Verify as Boy\n`!vg [@user]` — Verify as Girl\n' +
            '`!sas [@user]` — Add to Sas List\n`!unsas [@user]` — Remove from Sas List\n' +
            '`!saslist` — Show Sas List\n`!lbvb` — Top 10 Verification Staff'
        ).setFooter({ text: 'Staff Team · Verification role · Admin' }),
    help_jail: () => new EmbedBuilder().setTitle('🔒  Jail Commands').setColor(C.JAIL)
        .setDescription(
            '`!jail [@user] [reason]` — Jail a member\n`!unjail [@user]` — Unjail as Boy\n' +
            '`!unjail [@user] g` — Unjail as Girl\n`!jailcase [@user]` — Show jail case\n`!lbj` — Top 10 Jailers'
        ).setFooter({ text: 'Staff Team · Admin' }),
    help_warn: () => new EmbedBuilder().setTitle('⚠️  Warn Commands').setColor(C.WARN)
        .setDescription(
            '`!warn [@user] [reason]` — Warn a member\n`!unwarn [@user]` — Remove 1 warn\n' +
            '`!warns [@user]` — Show warns\n\n' +
            '`1 warn` → First Warn\n`2 warns` → Second Warn\n`3 warns` → Last Warn + Muted\n`4+ warns` → Auto-kick'
        ).setFooter({ text: 'Staff Team · Admin' }),
    help_timeout: () => new EmbedBuilder().setTitle('⏱️  Timeout Commands').setColor(C.TIMEOUT)
        .setDescription(
            '`!timeout [@user] [durée] [raison]` — Timeout un membre\n\n' +
            '`s` secondes · `m` minutes · `h` heures · `d` jours\n' +
            'Exemple : `!timeout @user 10m spam`\nMaximum : 28 jours'
        ).setFooter({ text: 'Staff Team · Admin' }),
    help_voice: () => new EmbedBuilder().setTitle('🔊  Voice Commands').setColor(C.VOICE)
        .setDescription(
            '`!vc` — Server statistics\n`!join` — Bot joins your voice channel\n' +
            '`!aji [@user] [#channel]` — Move member (no channel = your vc)\n' +
            '`!vkick [@user]` — Kick from voice\n`!ot` — Move yourself to One Tap 1\n`!ms7 [1-100]` — Bulk delete messages'
        ).setFooter({ text: '!ot is open to everyone' }),
    help_info: () => new EmbedBuilder().setTitle('📋  Info Commands').setColor(C.INFO)
        .setDescription(
            '`!a [@user]` — Avatar\n`!b [@user]` — Banner\n`!user [@user]` — Member info\n' +
            '`!staff [@user]` — Staff info\n`!myinvites` — Your active invites\n' +
            '`!inviteowner [code]` — Invite link owner\n`!lbvb` — Top 10 verifiers\n`!lbj` — Top 10 jailers'
        ).setFooter({ text: 'Open to everyone' }),
    help_games: () => new EmbedBuilder().setTitle('🎮  Game Mention Commands').setColor(C.GOLD)
        .setDescription(
            '`!pes` `!among` `!ff` `!codenames` `!lol`\n`!valo` `!plato` `!mc` `!stumble` `!brawl`\n' +
            '`!cs` `!roblox` `!pubg` `!parchisi` `!fifa`\n`!gta` `!cod` `!fortnite` `!monopoly`\n' +
            '`!bloodstrike` `!chess`\n\n⏳ Cooldown: **30 minutes** per channel'
        ).setFooter({ text: 'Open to everyone' }),
};

function buildAllCommandsDm(guild) {
    return (
        `**FAWDA Bot — All Commands**\nServer: ${guild.name}\n\n` +
        `**VERIFICATION**\n!vb @user | !vg @user | !sas @user | !unsas @user | !saslist | !lbvb\n\n` +
        `**JAIL**\n!jail @user [reason] | !unjail @user | !unjail @user g | !jailcase @user | !lbj\n\n` +
        `**WARN**\n!warn @user [reason] | !unwarn @user | !warns @user\n\n` +
        `**TIMEOUT**\n!timeout @user [10m] [reason]\n\n` +
        `**VOICE**\n!join | !vc | !aji @user [#channel] | !vkick @user | !ot | !ms7 [n]\n\n` +
        `**INFO**\n!a @user | !b @user | !user @user | !staff @user | !myinvites | !inviteowner [code]\n\n` +
        `**GAMES** (30min cooldown per channel)\n!pes !among !ff !codenames !lol !valo !plato !mc\n` +
        `!stumble !brawl !cs !roblox !pubg !parchisi !fifa !gta !cod !fortnite !monopoly !bloodstrike !chess`
    );
}

module.exports = { buildHelpRows, HELP_PANELS, buildAllCommandsDm };
