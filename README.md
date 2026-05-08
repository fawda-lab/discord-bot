# FAWDA Discord Bots

A two-bot Discord system built with **discord.js v14** for the FAWDA community server. One bot handles the XP/leveling rank system; the other covers moderation, verification, voice utilities, and games.

---

## Features

### Rank Bot (`=`)
- **XP & Leveling** — Earns XP from messages (15–25 XP, 60s cooldown) and voice time (10 XP/min)
- **Rank Cards** — Canvas-rendered PNG cards with dynamic colors per rank tier
- **10 Rank Roles** — Bronze → Epic → Celestia → Elite → Cosmic → Master → Grand Master → Champion → Hero → Royal
- **Leaderboard** — Top 10 XP rankings with level display
- **Staff Tools** — Give XP, reset XP (owner only)

### Main Bot (`+`)
- **Verification** — Assign Boy/Girl roles to members; leaderboard of top verifiers
- **Sas System** — Maintain a flagged-members watchlist
- **Moderation** — Jail (with role snapshot/restore), warns (auto-mute at 3, auto-kick at 4+), timeout, bulk delete
- **Jail Leaderboard** — Track which staff members jailed the most
- **Voice Utilities** — Move members between channels, server statistics, One Tap shortcut
- **Info Commands** — User info, staff stats, avatar, banner, invite lookup
- **Games** — Ping game roles (21 games, 30-minute per-channel cooldown)
- **Help Panel** — Interactive button panel with per-category command lists; DM export

---

## Project Structure

```
discord-bot/
├── main_bot.js                    # Main bot entry point
├── rank_bot.js                    # Rank bot entry point
├── logger.js                      # Shared logger (colored console + daily log files)
├── config.example.json            # Example config (copy → set env vars)
├── package.json
│
├── utils/
│   ├── constants.js               # Rank bot constants (XP rates, rank thresholds)
│   ├── dataManager.js             # XP data: load, save (atomic), addXP, calcLevel
│   ├── embeds.js                  # errEmbed() for rank bot
│   ├── mainConstants.js           # Main bot constants (colors, roles, game roles)
│   ├── mainData.js                # Main bot data: load, save (atomic)
│   ├── mainHelpers.js             # Shared helpers: ft, errEmbed, warnBar, resolveUser
│   └── helpPanels.js              # Help button builders and DM formatter
│
├── commands/
│   ├── rank/
│   │   ├── rank.js                # Rank card (canvas PNG)
│   │   ├── lb.js                  # XP leaderboard
│   │   ├── givexp.js              # Give XP (staff)
│   │   ├── resetxp.js             # Reset XP (owner)
│   │   └── help.js                # Rank bot help
│   └── main/
│       ├── verification/
│       │   ├── vb.js              # Verify as Boy
│       │   ├── vg.js              # Verify as Girl
│       │   ├── sas.js             # Add to sas list
│       │   ├── unsas.js           # Remove from sas list
│       │   ├── saslist.js         # View sas list
│       │   └── lbvb.js            # Top verifiers leaderboard
│       ├── moderation/
│       │   ├── jail.js            # Jail member (strips + snapshots roles)
│       │   ├── unjail.js          # Unjail member (restores roles)
│       │   ├── jailcase.js        # View jail case
│       │   ├── lbj.js             # Top jailers leaderboard
│       │   ├── warn.js            # Warn member
│       │   ├── unwarn.js          # Remove warn
│       │   ├── warns.js           # View warn history
│       │   ├── timeout.js         # Timeout member
│       │   └── ms7.js             # Bulk delete messages
│       ├── voice/
│       │   ├── join.js            # Show current voice channel
│       │   ├── vc.js              # Server statistics
│       │   ├── aji.js             # Move member to voice channel
│       │   ├── vkick.js           # Kick from voice
│       │   └── ot.js              # Move to One Tap 1
│       ├── info/
│       │   ├── user.js            # User info embed
│       │   ├── staff.js           # Staff stats embed
│       │   ├── a.js               # Avatar
│       │   ├── b.js               # Banner
│       │   ├── myinvites.js       # Your active invites
│       │   └── inviteowner.js     # Invite code lookup
│       ├── games/
│       │   └── games.js           # All 21+ game ping commands
│       └── general/
│           └── help.js            # Interactive help panel
│
└── logs/                          # Auto-created; gitignored
    └── YYYY-MM-DD.log
```

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/fawda-lab/discord-bot.git
cd discord-bot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

The bots read tokens from environment variables. Set them in your shell, `.env` file, or hosting dashboard:

| Variable     | Description                    |
|--------------|--------------------------------|
| `RANK_TOKEN` | Discord bot token for rank bot |
| `MAIN_TOKEN` | Discord bot token for main bot |

See `config.example.json` for reference.

### 4. Run the bots

```bash
# Run the main bot
npm run start:main

# Run the rank bot (separate terminal or process)
npm run start:rank
```

Both bots spin up a lightweight HTTP server (rank: port `3000`, main: port `3001`) used for health checks. This port can be overridden with the `PORT` environment variable.

---

## Commands

### Rank Bot — prefix `=`

| Command | Description |
|---------|-------------|
| `=rank [user]` | Display rank card (canvas PNG) with level, XP, and server rank |
| `=lb` | XP leaderboard — top 10 members |
| `=givexp <user> <amount>` | Give XP to a member *(staff only)* |
| `=resetxp <user>` | Reset a member's XP to zero *(owner only)* |
| `=help` / `=rankhelp` | Rank bot help panel |

**XP Rates**
- Messages: 15–25 XP per message (60-second cooldown)
- Voice: 10 XP per minute in a voice channel

**Rank Milestones**

| Level | Role |
|-------|------|
| 10 | »Bronze |
| 20 | »Epic |
| 30 | »Celestia |
| 40 | »Elite |
| 50 | »Cosmic |
| 60 | »Master |
| 70 | »Grand Master |
| 80 | »Champion |
| 90 | »Hero |
| 100 | »Royal |

---

### Main Bot — prefix `+`

#### Verification *(staff only)*

| Command | Description |
|---------|-------------|
| `+vb <user>` | Verify member as Boy (assigns Boy + Male roles) |
| `+vg <user>` | Verify member as Girl (assigns Girl + Female roles) |
| `+sas <user>` | Add member to the sas watchlist |
| `+unsas <user>` | Remove member from the sas watchlist |
| `+saslist` | Display the current sas watchlist |
| `+lbvb` | Top 10 members by verification count |

#### Moderation *(staff only)*

| Command | Description |
|---------|-------------|
| `+jail <user> [reason]` | Jail a member — strips all roles, saves a snapshot |
| `+unjail <user>` | Release from jail and restore role snapshot |
| `+jailcase <user>` | View a member's active jail case |
| `+lbj` | Top 10 staff members by jail count |
| `+warn <user> [reason]` | Warn a member (3 warns → mute; 4+ → auto-kick) |
| `+unwarn <user>` | Remove one warn from a member |
| `+warns <user>` | View full warn history for a member |
| `+timeout <user> <duration>` | Timeout a member |
| `+ms7 [1–100]` | Bulk-delete messages in current channel |

#### Voice *(staff only where noted)*

| Command | Description |
|---------|-------------|
| `+join` | Display your current voice channel |
| `+vc` | Server statistics (members, online, in voice, channels, roles, boosts) |
| `+aji <user> [channel]` *(staff)* | Move a member to a voice channel |
| `+vkick <user>` *(staff)* | Disconnect a member from voice |
| `+ot` | Move yourself to the One Tap 1 channel |

#### Info

| Command | Description |
|---------|-------------|
| `+user [user]` | User info: username, ID, join date, roles |
| `+staff [user]` | Staff stats: verifications, jails, roles |
| `+a [user]` | Display avatar |
| `+b [user]` | Display banner |
| `+myinvites` | List your active server invites |
| `+inviteowner <code>` | Look up invite code details |

#### Games *(30-minute cooldown per channel)*

Pings the corresponding game role to find players. Supported games:

`+pes` · `+lol` · `+valo` / `+valorant` · `+ff` / `+freefire` · `+mc` / `+minecraft` · `+cs` · `+pubg` · `+gta` · `+cod` · `+fortnite` · `+roblox` · `+among` / `+amongus` · `+codenames` · `+plato` · `+stumble` / `+stumbleguys` · `+brawl` / `+brawlhalla` · `+parchisi` · `+fifa` · `+monopoly` · `+bloodstrike` · `+chess`

#### General

| Command | Description |
|---------|-------------|
| `+help` | Interactive help panel with category buttons; DM export option |

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Node.js](https://nodejs.org/) | Runtime |
| [discord.js v14](https://discord.js.org/) | Discord API wrapper |
| [@napi-rs/canvas](https://github.com/Brooooooklyn/canvas) | Rank card image generation |
| `fs` / `path` | Atomic JSON persistence, file logging |

---

## Deployment

### Render

Both bots are deployed as separate **Web Services** on [Render](https://render.com).

1. Create a new Web Service for each bot.
2. Set **Environment** to `Node`.
3. Set **Start Command**:
   - Main bot: `node main_bot.js`
   - Rank bot: `node rank_bot.js`
4. Add `MAIN_TOKEN` / `RANK_TOKEN` as environment variables in the Render dashboard.

Each bot starts an HTTP server on its assigned port. Render uses this to verify the service is healthy.

### UptimeRobot

Render free-tier services sleep after inactivity. Use [UptimeRobot](https://uptimerobot.com) to keep both bots alive:

1. Add a new **HTTP(s)** monitor for each bot's Render URL.
2. Set the check interval to **5 minutes**.
3. UptimeRobot's regular pings prevent the services from sleeping.

---

## License

Private — for use within the FAWDA community server.
