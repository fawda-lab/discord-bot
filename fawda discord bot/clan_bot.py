import discord
from discord.ext import commands
import json
import os
import asyncio
import aiohttp
from datetime import datetime, timezone

# ─── Config ───────────────────────────────────────────────────────────────────
TOKEN = "YOUR_BOT_TOKEN_HERE"
DEFAULT_PREFIX = "&"
DATA_FILE = "clans_data.json"

# Role IDs – fill these in
CLAN_MANAGER_ROLE_ID = 0   # Role allowed to use manager commands
CLAN_OF_WEEK_ROLE_ID  = 0   # Role given for clan of the week

# ─── Rate-limit safe helpers ───────────────────────────────────────────────────
REQUEST_DELAY = 0.5   # seconds between Discord API calls inside loops

# ─── Data helpers ─────────────────────────────────────────────────────────────

def load_data() -> dict:
    if not os.path.exists(DATA_FILE):
        return {"clans": {}, "members": {}, "prefixes": {}}
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_data(data: dict):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def get_prefix(bot, message):
    data = load_data()
    return data["prefixes"].get(str(message.guild.id), DEFAULT_PREFIX) if message.guild else DEFAULT_PREFIX

# ─── Bot setup ────────────────────────────────────────────────────────────────
intents = discord.Intents.default()
intents.members = True
intents.message_content = True
intents.voice_states = True

bot = commands.Bot(command_prefix=get_prefix, intents=intents, help_command=None)

# ─── Checks ───────────────────────────────────────────────────────────────────

def is_clan_manager():
    async def predicate(ctx):
        if CLAN_MANAGER_ROLE_ID:
            return any(r.id == CLAN_MANAGER_ROLE_ID for r in ctx.author.roles)
        return ctx.author.guild_permissions.administrator
    return commands.check(predicate)

def get_user_clan(data: dict, guild_id: str, user_id: str):
    """Return (clan_id, clan) or (None, None)."""
    for cid, clan in data["clans"].items():
        if clan.get("guild_id") != guild_id:
            continue
        if user_id == clan.get("leader") or user_id in clan.get("coleaders", []) or user_id in clan.get("members", []):
            return cid, clan
    return None, None

def get_clan_by_leader(data: dict, guild_id: str, user_id: str):
    for cid, clan in data["clans"].items():
        if clan.get("guild_id") == guild_id and clan.get("leader") == user_id:
            return cid, clan
    return None, None

def is_leader_or_coleader(clan: dict, user_id: str) -> bool:
    return user_id == clan.get("leader") or user_id in clan.get("coleaders", [])

# ─── Events ───────────────────────────────────────────────────────────────────

@bot.event
async def on_ready():
    print(f"[Clan Bot] Logged in as {bot.user} ({bot.user.id})")

@bot.event
async def on_voice_state_update(member: discord.Member, before, after):
    """Track time spent in voice for mypoints/mytime."""
    data = load_data()
    uid = str(member.id)
    gid = str(member.guild.id)
    key = f"{gid}_{uid}"
    if key not in data["members"]:
        data["members"][key] = {"join_ts": None, "seconds": 0, "points": 0}

    now = datetime.now(timezone.utc).timestamp()
    if after.channel and not before.channel:
        data["members"][key]["join_ts"] = now
    elif before.channel and not after.channel:
        ts = data["members"][key].get("join_ts")
        if ts:
            elapsed = int(now - ts)
            data["members"][key]["seconds"] = data["members"][key].get("seconds", 0) + elapsed
            data["members"][key]["join_ts"] = None
    save_data(data)

# ─── General commands ─────────────────────────────────────────────────────────

@bot.command(name="setprefix")
@commands.has_permissions(administrator=True)
async def setprefix(ctx, new_prefix: str):
    data = load_data()
    data["prefixes"][str(ctx.guild.id)] = new_prefix
    save_data(data)
    await ctx.send(f"Prefix changed to `{new_prefix}`")

@bot.command(name="help-setup")
async def help_setup(ctx):
    embed = discord.Embed(title="FAWDA Clans Bot – Setup Help", color=0xe74c3c)
    embed.add_field(name="Create a clan", value="`&create [leader] [name]`", inline=False)
    embed.add_field(name="Setup clan chat", value="`&chat [clanID] [#channel]`", inline=False)
    embed.add_field(name="Setup clan voice", value="`&voice [clanID] [#channel]`", inline=False)
    embed.add_field(name="Update clan role", value="`&updaterole [clanID] [@role]`", inline=False)
    embed.add_field(name="Change prefix", value="`&setprefix [prefix]`", inline=False)
    embed.set_footer(text="Use &help for full command list")
    await ctx.send(embed=embed)

@bot.command(name="help")
async def help_cmd(ctx):
    prefix = get_prefix(bot, ctx.message)
    e = discord.Embed(
        title="FAWDA Clans Bot",
        description=f"My Prefix : `{prefix}` / Use : `{prefix}setprefix` To change it\n\nThe Clans bot manages user clans, alliances, clan properties and more.",
        color=0xe74c3c,
    )
    e.add_field(
        name="Clan Leader Commands",
        value=(
            f"`adduser` `removeuser` `addcol` `removecol`\n"
            f"`moveclan` `nick` `setup icon/banner/color`\n"
            f"`clanrole` `set-owner` `tag` `settag` `annc`"
        ),
        inline=False,
    )
    e.add_field(
        name="Member Commands",
        value="`leave` `info` `myclan` `list` `clanlist` `mypoints` `mytime`",
        inline=False,
    )
    e.add_field(
        name="Clan Manager Commands",
        value=(
            f"`create` `delete` `voice` `chat` `forceaddusers`\n"
            f"`clan-of-the-week` `giveclan` `renameclan` `updaterole`\n"
            f"`update-members-limit` `update-coleaders-limit`\n"
            f"`clearcoleaders` `resetpoints` `restoreclan` `clancheck`"
        ),
        inline=False,
    )
    await ctx.send(embed=e)

# ─── CLAN MANAGER COMMANDS ────────────────────────────────────────────────────

@bot.command(name="create")
@is_clan_manager()
async def create_clan(ctx, leader: discord.Member, *, name: str):
    data = load_data()
    gid = str(ctx.guild.id)

    # Check leader not already leading a clan
    existing_id, _ = get_clan_by_leader(data, gid, str(leader.id))
    if existing_id:
        return await ctx.send(f"{leader.mention} already leads a clan.")

    import random, string
    clan_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    while clan_id in data["clans"]:
        clan_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

    data["clans"][clan_id] = {
        "guild_id": gid,
        "name": name,
        "leader": str(leader.id),
        "coleaders": [],
        "members": [],
        "tag": "",
        "icon": "",
        "banner": "",
        "color": 0xe74c3c,
        "role_id": None,
        "voice_id": None,
        "chat_id": None,
        "members_limit": 20,
        "coleaders_limit": 5,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    save_data(data)
    embed = discord.Embed(title="Clan Created", color=0x2ecc71)
    embed.add_field(name="Clan ID", value=clan_id)
    embed.add_field(name="Name", value=name)
    embed.add_field(name="Leader", value=leader.mention)
    await ctx.send(embed=embed)

@bot.command(name="delete")
@is_clan_manager()
async def delete_clan(ctx, leader: discord.Member):
    data = load_data()
    gid = str(ctx.guild.id)
    cid, clan = get_clan_by_leader(data, gid, str(leader.id))
    if not cid:
        return await ctx.send("No clan found for that leader.")
    del data["clans"][cid]
    save_data(data)
    await ctx.send(f"Clan **{clan['name']}** (`{cid}`) deleted.")

@bot.command(name="voice")
@is_clan_manager()
async def set_voice(ctx, clan_id: str, channel: discord.VoiceChannel):
    data = load_data()
    if clan_id not in data["clans"] or data["clans"][clan_id]["guild_id"] != str(ctx.guild.id):
        return await ctx.send("Clan not found.")
    data["clans"][clan_id]["voice_id"] = str(channel.id)
    save_data(data)
    await ctx.send(f"Voice channel for clan `{clan_id}` set to {channel.mention}")

@bot.command(name="chat")
@is_clan_manager()
async def set_chat(ctx, clan_id: str, channel: discord.TextChannel):
    data = load_data()
    if clan_id not in data["clans"] or data["clans"][clan_id]["guild_id"] != str(ctx.guild.id):
        return await ctx.send("Clan not found.")
    data["clans"][clan_id]["chat_id"] = str(channel.id)
    save_data(data)
    await ctx.send(f"Chat channel for clan `{clan_id}` set to {channel.mention}")

@bot.command(name="forceaddusers")
@is_clan_manager()
async def forceaddusers(ctx, clan_id: str, role: discord.Role):
    data = load_data()
    gid = str(ctx.guild.id)
    if clan_id not in data["clans"] or data["clans"][clan_id]["guild_id"] != gid:
        return await ctx.send("Clan not found.")
    clan = data["clans"][clan_id]
    added = 0
    for member in role.members:
        uid = str(member.id)
        if uid != clan["leader"] and uid not in clan["coleaders"] and uid not in clan["members"]:
            if len(clan["members"]) < clan.get("members_limit", 20):
                clan["members"].append(uid)
                added += 1
            await asyncio.sleep(REQUEST_DELAY)
    save_data(data)
    await ctx.send(f"Added **{added}** members from {role.mention} to clan `{clan_id}`.")

@bot.command(name="clan-of-the-week")
@is_clan_manager()
async def clan_of_the_week(ctx, clan_id: str):
    data = load_data()
    gid = str(ctx.guild.id)
    if clan_id not in data["clans"] or data["clans"][clan_id]["guild_id"] != gid:
        return await ctx.send("Clan not found.")
    if not CLAN_OF_WEEK_ROLE_ID:
        return await ctx.send("CLAN_OF_WEEK_ROLE_ID not configured.")
    role = ctx.guild.get_role(CLAN_OF_WEEK_ROLE_ID)
    if not role:
        return await ctx.send("Clan of the week role not found.")
    clan = data["clans"][clan_id]
    all_ids = [clan["leader"]] + clan.get("coleaders", []) + clan.get("members", [])
    given = 0
    for uid in all_ids:
        member = ctx.guild.get_member(int(uid))
        if member and role not in member.roles:
            try:
                await member.add_roles(role, reason="Clan of the Week")
                given += 1
                await asyncio.sleep(REQUEST_DELAY)
            except discord.Forbidden:
                pass
    await ctx.send(f"Gave Clan of the Week role to **{given}** members of clan `{clan_id}`.")

@bot.command(name="giveclan")
@is_clan_manager()
async def giveclan(ctx, clan_id: str, new_leader: discord.Member):
    data = load_data()
    gid = str(ctx.guild.id)
    if clan_id not in data["clans"] or data["clans"][clan_id]["guild_id"] != gid:
        return await ctx.send("Clan not found.")
    data["clans"][clan_id]["leader"] = str(new_leader.id)
    save_data(data)
    await ctx.send(f"Clan `{clan_id}` transferred to {new_leader.mention}.")

@bot.command(name="renameclan")
@is_clan_manager()
async def renameclan(ctx, clan_id: str, *, name: str):
    data = load_data()
    if clan_id not in data["clans"] or data["clans"][clan_id]["guild_id"] != str(ctx.guild.id):
        return await ctx.send("Clan not found.")
    data["clans"][clan_id]["name"] = name
    save_data(data)
    await ctx.send(f"Clan `{clan_id}` renamed to **{name}**.")

@bot.command(name="updaterole")
@is_clan_manager()
async def updaterole(ctx, clan_id: str, role: discord.Role):
    data = load_data()
    if clan_id not in data["clans"] or data["clans"][clan_id]["guild_id"] != str(ctx.guild.id):
        return await ctx.send("Clan not found.")
    data["clans"][clan_id]["role_id"] = str(role.id)
    save_data(data)
    await ctx.send(f"Role for clan `{clan_id}` set to {role.mention}.")

@bot.command(name="update-members-limit")
@is_clan_manager()
async def update_members_limit(ctx, clan_id: str, number: int):
    data = load_data()
    if clan_id not in data["clans"] or data["clans"][clan_id]["guild_id"] != str(ctx.guild.id):
        return await ctx.send("Clan not found.")
    data["clans"][clan_id]["members_limit"] = number
    save_data(data)
    await ctx.send(f"Members limit for clan `{clan_id}` set to **{number}**.")

@bot.command(name="update-coleaders-limit")
@is_clan_manager()
async def update_coleaders_limit(ctx, clan_id: str, number: int):
    data = load_data()
    if clan_id not in data["clans"] or data["clans"][clan_id]["guild_id"] != str(ctx.guild.id):
        return await ctx.send("Clan not found.")
    data["clans"][clan_id]["coleaders_limit"] = number
    save_data(data)
    await ctx.send(f"Co-leaders limit for clan `{clan_id}` set to **{number}**.")

@bot.command(name="clearcoleaders")
@is_clan_manager()
async def clearcoleaders(ctx):
    data = load_data()
    gid = str(ctx.guild.id)
    total_removed = 0
    for clan in data["clans"].values():
        if clan.get("guild_id") != gid:
            continue
        still_here = []
        for uid in clan.get("coleaders", []):
            m = ctx.guild.get_member(int(uid))
            if m:
                still_here.append(uid)
            else:
                total_removed += 1
        clan["coleaders"] = still_here
    save_data(data)
    await ctx.send(f"Removed **{total_removed}** co-leaders no longer in the server.")

@bot.command(name="resetpoints")
@is_clan_manager()
async def resetpoints(ctx):
    data = load_data()
    gid = str(ctx.guild.id)
    for key in list(data["members"].keys()):
        if key.startswith(f"{gid}_"):
            data["members"][key]["seconds"] = 0
            data["members"][key]["points"] = 0
            data["members"][key]["join_ts"] = None
    save_data(data)
    await ctx.send("All member time/points reset.")

@bot.command(name="restoreclan")
@is_clan_manager()
async def restoreclan(ctx):
    """Re-add clan role to all members based on DB."""
    data = load_data()
    gid = str(ctx.guild.id)
    restored = 0
    for cid, clan in data["clans"].items():
        if clan.get("guild_id") != gid or not clan.get("role_id"):
            continue
        role = ctx.guild.get_role(int(clan["role_id"]))
        if not role:
            continue
        all_ids = [clan["leader"]] + clan.get("coleaders", []) + clan.get("members", [])
        for uid in all_ids:
            member = ctx.guild.get_member(int(uid))
            if member and role not in member.roles:
                try:
                    await member.add_roles(role, reason="restoreclan")
                    restored += 1
                    await asyncio.sleep(REQUEST_DELAY)
                except discord.Forbidden:
                    pass
    await ctx.send(f"Restored clan roles for **{restored}** members.")

@bot.command(name="clancheck")
@is_clan_manager()
async def clancheck(ctx):
    data = load_data()
    gid = str(ctx.guild.id)
    clans = {cid: c for cid, c in data["clans"].items() if c.get("guild_id") == gid}
    embed = discord.Embed(title="Clan Management Overview", color=0xe74c3c)
    for cid, clan in clans.items():
        leader = ctx.guild.get_member(int(clan["leader"]))
        role = ctx.guild.get_role(int(clan["role_id"])) if clan.get("role_id") else None
        embed.add_field(
            name=f"{clan['name']} (`{cid}`)",
            value=(
                f"Leader: {leader.mention if leader else clan['leader']}\n"
                f"Members: {len(clan.get('members', []))}/{clan.get('members_limit', 20)}\n"
                f"Co-leaders: {len(clan.get('coleaders', []))}/{clan.get('coleaders_limit', 5)}\n"
                f"Role: {role.mention if role else 'None'}"
            ),
            inline=False,
        )
    if not clans:
        embed.description = "No clans found."
    await ctx.send(embed=embed)

# ─── CLAN LEADER COMMANDS ─────────────────────────────────────────────────────

async def require_leader_or_coleader(ctx, data, gid):
    uid = str(ctx.author.id)
    cid, clan = get_user_clan(data, gid, uid)
    if not cid:
        await ctx.send("You are not in any clan.")
        return None, None
    if not is_leader_or_coleader(clan, uid):
        await ctx.send("Only clan leaders and co-leaders can use this command.")
        return None, None
    return cid, clan

@bot.command(name="adduser")
async def adduser(ctx, member: discord.Member):
    data = load_data()
    gid = str(ctx.guild.id)
    cid, clan = await require_leader_or_coleader(ctx, data, gid)
    if not cid:
        return
    uid = str(member.id)
    existing_cid, _ = get_user_clan(data, gid, uid)
    if existing_cid:
        return await ctx.send(f"{member.mention} is already in a clan.")
    if len(clan["members"]) >= clan.get("members_limit", 20):
        return await ctx.send("Your clan is full.")
    clan["members"].append(uid)
    if clan.get("role_id"):
        role = ctx.guild.get_role(int(clan["role_id"]))
        if role:
            try:
                await member.add_roles(role, reason="adduser")
                await asyncio.sleep(REQUEST_DELAY)
            except discord.Forbidden:
                pass
    save_data(data)
    await ctx.send(f"{member.mention} added to **{clan['name']}**.")

@bot.command(name="removeuser")
async def removeuser(ctx, member: discord.Member):
    data = load_data()
    gid = str(ctx.guild.id)
    cid, clan = await require_leader_or_coleader(ctx, data, gid)
    if not cid:
        return
    uid = str(member.id)
    if uid not in clan["members"]:
        return await ctx.send(f"{member.mention} is not a member of your clan.")
    clan["members"].remove(uid)
    if clan.get("role_id"):
        role = ctx.guild.get_role(int(clan["role_id"]))
        if role and role in member.roles:
            try:
                await member.remove_roles(role, reason="removeuser")
                await asyncio.sleep(REQUEST_DELAY)
            except discord.Forbidden:
                pass
    save_data(data)
    await ctx.send(f"{member.mention} removed from **{clan['name']}**.")

@bot.command(name="addcol")
async def addcol(ctx, member: discord.Member):
    data = load_data()
    gid = str(ctx.guild.id)
    uid_author = str(ctx.author.id)
    cid, clan = get_clan_by_leader(data, gid, uid_author)
    if not cid:
        return await ctx.send("Only the clan leader can add co-leaders.")
    uid = str(member.id)
    if uid in clan["coleaders"]:
        return await ctx.send(f"{member.mention} is already a co-leader.")
    if len(clan["coleaders"]) >= clan.get("coleaders_limit", 5):
        return await ctx.send("Co-leader slots are full.")
    if uid in clan["members"]:
        clan["members"].remove(uid)
    clan["coleaders"].append(uid)
    save_data(data)
    await ctx.send(f"{member.mention} is now a co-leader of **{clan['name']}**.")

@bot.command(name="removecol")
async def removecol(ctx, member: discord.Member):
    data = load_data()
    gid = str(ctx.guild.id)
    uid_author = str(ctx.author.id)
    cid, clan = get_clan_by_leader(data, gid, uid_author)
    if not cid:
        return await ctx.send("Only the clan leader can remove co-leaders.")
    uid = str(member.id)
    if uid not in clan["coleaders"]:
        return await ctx.send(f"{member.mention} is not a co-leader.")
    clan["coleaders"].remove(uid)
    clan["members"].append(uid)
    save_data(data)
    await ctx.send(f"{member.mention} is no longer a co-leader.")

@bot.command(name="moveclan")
async def moveclan(ctx, channel: discord.VoiceChannel = None):
    data = load_data()
    gid = str(ctx.guild.id)
    cid, clan = await require_leader_or_coleader(ctx, data, gid)
    if not cid:
        return
    if not channel:
        vc_id = clan.get("voice_id")
        if not vc_id:
            return await ctx.send("No clan voice channel configured. Use `&voice [clanID] [channel]`.")
        channel = ctx.guild.get_channel(int(vc_id))
        if not channel:
            return await ctx.send("Clan voice channel not found.")
    all_ids = set([clan["leader"]] + clan.get("coleaders", []) + clan.get("members", []))
    moved = 0
    for uid in all_ids:
        member = ctx.guild.get_member(int(uid))
        if member and member.voice and member.voice.channel:
            try:
                await member.move_to(channel, reason="moveclan")
                moved += 1
                await asyncio.sleep(REQUEST_DELAY)
            except discord.Forbidden:
                pass
    await ctx.send(f"Moved **{moved}** clan members to {channel.mention}.")

@bot.command(name="nick")
async def nick(ctx, member: discord.Member, *, nickname: str):
    data = load_data()
    gid = str(ctx.guild.id)
    cid, clan = await require_leader_or_coleader(ctx, data, gid)
    if not cid:
        return
    uid = str(member.id)
    if uid not in clan.get("members", []) and not is_leader_or_coleader(clan, uid):
        return await ctx.send(f"{member.mention} is not in your clan.")
    try:
        await member.edit(nick=nickname, reason="clan nick command")
        await ctx.send(f"Nickname updated for {member.mention}.")
    except discord.Forbidden:
        await ctx.send("I don't have permission to change that member's nickname.")

@bot.command(name="setup")
async def setup(ctx, option: str, *, value: str):
    data = load_data()
    gid = str(ctx.guild.id)
    uid = str(ctx.author.id)
    cid, clan = get_clan_by_leader(data, gid, uid)
    if not cid:
        # allow co-leader for banner/icon/color too
        cid, clan = get_user_clan(data, gid, uid)
        if not cid or not is_leader_or_coleader(clan, uid):
            return await ctx.send("Only clan leaders/co-leaders can use setup commands.")

    option = option.lower()
    if option == "icon":
        clan["icon"] = value
        save_data(data)
        embed = discord.Embed(title=f"{clan['name']} – Icon Updated", color=clan.get("color", 0xe74c3c))
        embed.set_thumbnail(url=value)
        await ctx.send(embed=embed)
    elif option == "banner":
        clan["banner"] = value
        save_data(data)
        embed = discord.Embed(title=f"{clan['name']} – Banner Updated", color=clan.get("color", 0xe74c3c))
        embed.set_image(url=value)
        await ctx.send(embed=embed)
    elif option == "color":
        try:
            color_int = int(value.strip("#"), 16)
        except ValueError:
            return await ctx.send("Invalid color. Use hex format like `#FF0000`.")
        clan["color"] = color_int
        save_data(data)
        await ctx.send(f"Clan color updated to `#{value.strip('#').upper()}`.")
    else:
        await ctx.send("Invalid option. Use `icon`, `banner`, or `color`.")

@bot.command(name="clanrole")
async def clanrole(ctx):
    data = load_data()
    gid = str(ctx.guild.id)
    cid, clan = get_user_clan(data, gid, str(ctx.author.id))
    if not cid:
        return await ctx.send("You are not in any clan.")
    if not clan.get("role_id"):
        return await ctx.send("No role configured for your clan.")
    role = ctx.guild.get_role(int(clan["role_id"]))
    if not role:
        return await ctx.send("Clan role not found.")
    await ctx.send(f"Clan role: {role.mention}")

@bot.command(name="set-owner")
async def set_owner(ctx, member: discord.Member):
    data = load_data()
    gid = str(ctx.guild.id)
    uid_author = str(ctx.author.id)
    cid, clan = get_clan_by_leader(data, gid, uid_author)
    if not cid:
        return await ctx.send("Only the current clan leader can transfer ownership.")
    uid = str(member.id)
    clan["leader"] = uid
    if uid in clan.get("coleaders", []):
        clan["coleaders"].remove(uid)
    if uid_author not in clan.get("coleaders", []):
        clan["coleaders"].append(uid_author)
    save_data(data)
    await ctx.send(f"Clan ownership transferred to {member.mention}.")

@bot.command(name="tag")
async def tag_cmd(ctx, member: discord.Member):
    data = load_data()
    gid = str(ctx.guild.id)
    cid, clan = await require_leader_or_coleader(ctx, data, gid)
    if not cid:
        return
    tag = clan.get("tag", "")
    if not tag:
        return await ctx.send("No tag set. Use `&settag [tag]` first.")
    uid = str(member.id)
    if uid not in clan.get("members", []) and not is_leader_or_coleader(clan, uid):
        return await ctx.send(f"{member.mention} is not in your clan.")
    current_nick = member.display_name
    if tag not in current_nick:
        try:
            await member.edit(nick=f"[{tag}] {current_nick}", reason="clan tag")
            await ctx.send(f"Tag `[{tag}]` added to {member.mention}.")
        except discord.Forbidden:
            await ctx.send("I don't have permission to change that nickname.")
    else:
        await ctx.send(f"{member.mention} already has the clan tag.")

@bot.command(name="settag")
async def settag(ctx, *, tag: str):
    data = load_data()
    gid = str(ctx.guild.id)
    cid, clan = await require_leader_or_coleader(ctx, data, gid)
    if not cid:
        return
    clan["tag"] = tag
    save_data(data)
    await ctx.send(f"Clan tag set to `{tag}`.")

@bot.command(name="annc")
async def annc(ctx, *, message: str):
    data = load_data()
    gid = str(ctx.guild.id)
    cid, clan = await require_leader_or_coleader(ctx, data, gid)
    if not cid:
        return
    chat_id = clan.get("chat_id")
    if not chat_id:
        return await ctx.send("No clan chat channel configured.")
    channel = ctx.guild.get_channel(int(chat_id))
    if not channel:
        return await ctx.send("Clan chat channel not found.")
    embed = discord.Embed(
        title=f"📢 Announcement – {clan['name']}",
        description=message,
        color=clan.get("color", 0xe74c3c),
    )
    embed.set_footer(text=f"By {ctx.author.display_name}")
    role_id = clan.get("role_id")
    mention = f"<@&{role_id}>" if role_id else ""
    await channel.send(content=mention, embed=embed)
    await ctx.send(f"Announcement sent to {channel.mention}.")

# ─── MEMBER COMMANDS ──────────────────────────────────────────────────────────

@bot.command(name="leave")
async def leave(ctx):
    data = load_data()
    gid = str(ctx.guild.id)
    uid = str(ctx.author.id)
    cid, clan = get_user_clan(data, gid, uid)
    if not cid:
        return await ctx.send("You are not in any clan.")
    if clan["leader"] == uid:
        return await ctx.send("You are the clan leader. Transfer ownership first with `&set-owner`.")
    if uid in clan.get("coleaders", []):
        clan["coleaders"].remove(uid)
    elif uid in clan.get("members", []):
        clan["members"].remove(uid)
    if clan.get("role_id"):
        role = ctx.guild.get_role(int(clan["role_id"]))
        if role and role in ctx.author.roles:
            try:
                await ctx.author.remove_roles(role, reason="clan leave")
                await asyncio.sleep(REQUEST_DELAY)
            except discord.Forbidden:
                pass
    save_data(data)
    await ctx.send(f"You have left **{clan['name']}**.")

@bot.command(name="info")
async def info(ctx, clan_id: str = None):
    data = load_data()
    gid = str(ctx.guild.id)
    if clan_id:
        if clan_id not in data["clans"] or data["clans"][clan_id]["guild_id"] != gid:
            return await ctx.send("Clan not found.")
        clan = data["clans"][clan_id]
        cid = clan_id
    else:
        cid, clan = get_user_clan(data, gid, str(ctx.author.id))
        if not cid:
            return await ctx.send("You are not in any clan. Provide a clan ID.")

    leader = ctx.guild.get_member(int(clan["leader"]))
    role = ctx.guild.get_role(int(clan["role_id"])) if clan.get("role_id") else None
    embed = discord.Embed(
        title=clan["name"],
        description=f"ID: `{cid}`",
        color=clan.get("color", 0xe74c3c),
    )
    if clan.get("icon"):
        embed.set_thumbnail(url=clan["icon"])
    if clan.get("banner"):
        embed.set_image(url=clan["banner"])
    embed.add_field(name="Leader", value=leader.mention if leader else clan["leader"])
    embed.add_field(name="Co-leaders", value=str(len(clan.get("coleaders", []))))
    embed.add_field(name="Members", value=f"{len(clan.get('members', []))}/{clan.get('members_limit', 20)}")
    if clan.get("tag"):
        embed.add_field(name="Tag", value=clan["tag"])
    if role:
        embed.add_field(name="Role", value=role.mention)
    await ctx.send(embed=embed)

@bot.command(name="myclan")
async def myclan(ctx):
    await info(ctx)

@bot.command(name="list")
async def list_clans(ctx):
    data = load_data()
    gid = str(ctx.guild.id)
    clans = {cid: c for cid, c in data["clans"].items() if c.get("guild_id") == gid}
    if not clans:
        return await ctx.send("No clans on this server.")
    embed = discord.Embed(title="All Clans", color=0xe74c3c)
    for cid, clan in clans.items():
        total = 1 + len(clan.get("coleaders", [])) + len(clan.get("members", []))
        embed.add_field(name=f"{clan['name']} (`{cid}`)", value=f"Members: {total}", inline=True)
    await ctx.send(embed=embed)

@bot.command(name="clanlist")
async def clanlist(ctx, clan_id: str = None):
    data = load_data()
    gid = str(ctx.guild.id)
    if clan_id:
        if clan_id not in data["clans"] or data["clans"][clan_id]["guild_id"] != gid:
            return await ctx.send("Clan not found.")
        cid = clan_id
        clan = data["clans"][clan_id]
    else:
        cid, clan = get_user_clan(data, gid, str(ctx.author.id))
        if not cid:
            return await ctx.send("You are not in any clan. Provide a clan ID.")

    leader = ctx.guild.get_member(int(clan["leader"]))
    embed = discord.Embed(title=f"{clan['name']} – Member List", color=clan.get("color", 0xe74c3c))
    embed.add_field(name="👑 Leader", value=leader.mention if leader else clan["leader"], inline=False)
    cols = [ctx.guild.get_member(int(u)) for u in clan.get("coleaders", [])]
    col_text = "\n".join(m.mention if m else u for m, u in zip(cols, clan.get("coleaders", [])))
    embed.add_field(name="⭐ Co-leaders", value=col_text or "None", inline=False)
    mems = [ctx.guild.get_member(int(u)) for u in clan.get("members", [])]
    mem_text = "\n".join(m.mention if m else u for m, u in zip(mems, clan.get("members", [])))
    embed.add_field(name="👤 Members", value=mem_text or "None", inline=False)
    await ctx.send(embed=embed)

@bot.command(name="mypoints")
async def mypoints(ctx):
    data = load_data()
    gid = str(ctx.guild.id)
    key = f"{gid}_{ctx.author.id}"
    entry = data["members"].get(key, {})
    points = entry.get("points", 0)
    seconds = entry.get("seconds", 0)
    embed = discord.Embed(title=f"{ctx.author.display_name} – Points", color=0xe74c3c)
    embed.add_field(name="Points", value=str(points))
    h, r = divmod(seconds, 3600)
    m, s = divmod(r, 60)
    embed.add_field(name="Time in Voice", value=f"{h}h {m}m {s}s")
    await ctx.send(embed=embed)

@bot.command(name="mytime")
async def mytime(ctx):
    data = load_data()
    gid = str(ctx.guild.id)
    key = f"{gid}_{ctx.author.id}"
    entry = data["members"].get(key, {})
    seconds = entry.get("seconds", 0)
    h, r = divmod(seconds, 3600)
    m, s = divmod(r, 60)
    embed = discord.Embed(
        title=f"{ctx.author.display_name} – Time Spent",
        description=f"**{h}h {m}m {s}s** in voice channels",
        color=0xe74c3c,
    )
    await ctx.send(embed=embed)

# ─── Error handler ────────────────────────────────────────────────────────────

@bot.event
async def on_command_error(ctx, error):
    if isinstance(error, commands.MissingRequiredArgument):
        await ctx.send(f"Missing argument: `{error.param.name}`. Check `&help` for usage.")
    elif isinstance(error, commands.BadArgument):
        await ctx.send(f"Bad argument: {error}")
    elif isinstance(error, commands.CheckFailure):
        await ctx.send("You don't have permission to use this command.")
    elif isinstance(error, commands.CommandNotFound):
        pass
    else:
        raise error

# ─── Run ──────────────────────────────────────────────────────────────────────
bot.run(TOKEN)
