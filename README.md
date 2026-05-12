# FAWDA Discord Bots

Multi-bot Discord server management system for the FAWDA community, with moderation tools, XP leveling, and a staff dashboard.

## Features

- Rank Bot: XP, leveling, rank cards, voice XP, daily rewards, leaderboard
- Main Bot: Verification, jail, warns, timeouts, anti-spam, voice management, game role pings
- Web Dashboard: Leaderboard, staff mod logs, Discord OAuth2 login

## Tech Stack

| Technology | Usage |
| --- | --- |
| Node.js | Bot runtime |
| discord.js v14 | Discord API client |
| MongoDB Atlas (Mongoose) | Shared persistence for bot and dashboard data |
| @napi-rs/canvas | Rank card image rendering |
| Railway | Bot hosting |
| Next.js 16 | Staff dashboard framework |
| Vercel | Dashboard hosting |

## Project Structure

```text
.
|-- rank_bot.js                  # Rank bot entry point
|-- main_bot.js                  # Main bot entry point
|-- logger.js                    # Shared timestamped logger
|-- package.json                 # Root bot package and scripts
|-- nixpacks.toml                # Railway build configuration
|-- fonts/
|   `-- LiberationSans-Regular.ttf
|-- commands/
|   |-- rank/
|   |   |-- daily.js
|   |   |-- givexp.js
|   |   |-- help.js
|   |   |-- lb.js
|   |   |-- rank.js
|   |   `-- resetxp.js
|   `-- main/
|       |-- verification/
|       |-- moderation/
|       |-- voice/
|       |-- info/
|       |-- games/
|       `-- general/
|-- utils/
|   |-- db.js
|   |-- dataManager.js
|   |-- mainData.js
|   |-- mainConstants.js
|   |-- mainHelpers.js
|   |-- permissions.js
|   |-- cooldownManager.js
|   |-- antiSpam.js
|   `-- models/
|       `-- Member.js
`-- dashboard/
    |-- app/
    |-- lib/
    |-- public/
    |-- types/
    |-- middleware.ts
    `-- package.json
```

## Setup

1. Clone the repo.

```bash
git clone <repo-url>
cd <repo-folder>
```

2. Install bot dependencies.

```bash
npm install
```

3. Create `.env` in the project root.

```env
MONGODB_URI=your_mongodb_atlas_connection_string
RANK_TOKEN=your_rank_bot_token
MAIN_TOKEN=your_main_bot_token
```

4. Run the bots.

```bash
node rank_bot.js
node main_bot.js
```

You can also use the package scripts:

```bash
npm run start:rank
npm run start:main
```

5. Run the dashboard.

```bash
cd dashboard
npm install
npm run dev
```

## Environment Variables

| Variable | Component | Description |
| --- | --- | --- |
| `MONGODB_URI` | Bots, Dashboard | MongoDB Atlas connection string shared by all services |
| `RANK_TOKEN` | Rank Bot | Discord token for `rank_bot.js` |
| `MAIN_TOKEN` | Main Bot | Discord token for `main_bot.js` |
| `DISCORD_CLIENT_ID` | Dashboard | Discord OAuth2 application client ID |
| `DISCORD_CLIENT_SECRET` | Dashboard | Discord OAuth2 application client secret |
| `NEXTAUTH_SECRET` | Dashboard | Secret used by NextAuth to sign and encrypt session data |
| `NEXTAUTH_URL` | Dashboard | Public dashboard URL used by NextAuth callbacks |
| `GUILD_ID` | Dashboard | Discord guild ID used for staff role verification |

## Bot Commands

### Rank Bot (prefix: `.`)

| Command | Description | Permission |
| --- | --- | --- |
| `.rank [user]` | Show a rank card with message XP, level, server rank, and voice XP | Everyone |
| `.lb` | Show the paginated XP leaderboard | Everyone |
| `.daily`, `.claim` | Claim a daily XP reward | Everyone |
| `.givexp <user> <amount>` | Add XP to a member | Owner |
| `.resetxp <user>` | Reset a member's XP after confirmation | Owner |
| `.help`, `.rankhelp` | Show rank bot help | Everyone |

### Main Bot (prefix: `!`)

#### Verification

| Command | Description | Permission |
| --- | --- | --- |
| `!vb <user>` | Verify a member as boy | Staff / Verification |
| `!vg <user>` | Verify a member as girl | Staff / Verification |
| `!sas <user>` | Mark a member as SAS/suspect | Staff / Verification |
| `!unsas <user>` | Remove SAS/suspect status | Staff / Verification |
| `!saslist` | Show the SAS/suspect list | Everyone |
| `!lbvb` | Show the verification leaderboard | Everyone |

#### Moderation

| Command | Description | Permission |
| --- | --- | --- |
| `!jail <user> [reason]` | Jail a member and save role state | Staff |
| `!unjail <user> [g]` | Release a jailed member | Staff |
| `!jailcase <user>` | Show the active jail case for a member | Everyone |
| `!warn <user> [reason]` | Warn a member and update warn roles | Staff |
| `!unwarn <user>` | Remove the latest warning | Staff |
| `!warns <user>` | Show warning history | Everyone |
| `!timeout <user> <duration> [reason]` | Apply a Discord timeout | Staff |
| `!ms7 [count]` | Bulk-delete messages after confirmation | Staff |
| `!modlogs <user>`, `!ml <user>` | Show paginated moderation history | Admin |
| `!lbj` | Show the jail leaderboard | Everyone |

#### Voice

| Command | Description | Permission |
| --- | --- | --- |
| `!join` | Show the caller's current voice channel | Everyone |
| `!vc` | Show server voice and member statistics | Everyone |
| `!aji <user> [channel]` | Move a member to a voice channel | Staff |
| `!vkick <user>` | Disconnect a member from voice | Staff |
| `!ot` | Move yourself to the One Tap voice channel | Everyone |

#### Info

| Command | Description | Permission |
| --- | --- | --- |
| `!a [user]` | Show a member avatar | Everyone |
| `!b [user]` | Show a member banner | Everyone |
| `!user [user]` | Show member profile information | Everyone |
| `!staff [user]` | Show staff statistics | Everyone |
| `!myinvites` | Show your active server invites | Everyone |
| `!inviteowner <code>` | Look up the owner of an invite code | Everyone |

#### Games

Game commands ping their configured game role and use a 30-minute cooldown per channel.

| Command | Description | Permission |
| --- | --- | --- |
| `!pes` | Ping the PES role | Everyone |
| `!among`, `!amongus` | Ping the Among Us role | Everyone |
| `!ff`, `!freefire` | Ping the Free Fire role | Everyone |
| `!codenames` | Ping the Codenames role | Everyone |
| `!lol` | Ping the League of Legends role | Everyone |
| `!valo`, `!valorant` | Ping the Valorant role | Everyone |
| `!plato` | Ping the Plato role | Everyone |
| `!mc`, `!minecraft` | Ping the Minecraft role | Everyone |
| `!stumble`, `!stumbleguys` | Ping the Stumble Guys role | Everyone |
| `!brawl`, `!brawlhalla` | Ping the Brawlhalla role | Everyone |
| `!cs` | Ping the CS role | Everyone |
| `!roblox` | Ping the Roblox role | Everyone |
| `!pubg` | Ping the PUBG role | Everyone |
| `!parchisi` | Ping the Parchisi role | Everyone |
| `!fifa` | Ping the FIFA role | Everyone |
| `!gta` | Ping the GTA role | Everyone |
| `!cod` | Ping the Call of Duty role | Everyone |
| `!fortnite` | Ping the Fortnite role | Everyone |
| `!monopoly` | Ping the Monopoly role | Everyone |
| `!bloodstrike` | Ping the Blood Strike role | Everyone |
| `!chess` | Ping the Chess role | Everyone |

## Deployment

- Bots: Railway, with two services pointing to the same repository.
- Rank Bot service start command: `npm run start:rank`.
- Main Bot service start command: `npm run start:main`.
- Dashboard: Vercel, connected to GitHub with the dashboard environment variables configured.
- Auto-deploys run when changes are pushed to the `main` branch.

## License

MIT
