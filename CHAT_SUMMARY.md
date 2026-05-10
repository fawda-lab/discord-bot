# FAWDA Discord Bot — Project Session Summary

## Project Overview

**FAWDA** is a multi-bot Discord server management system for a French-speaking community server. It consists of two separate bots running in parallel:

- **Rank Bot** (`rank_bot.js`) — XP tracking, leaderboard, rank cards, voice XP, daily rewards
- **Main Bot** (`main_bot.js`) — Moderation, verification, jail system, warn system, staff tools

Both bots share a single MongoDB Atlas database via Mongoose.

---

## Hosting

- **Previous**: Render (free tier, cold starts)
- **Current**: [Railway](https://railway.app) — always-on, auto-deploys from GitHub `main` branch
- Two Railway services: one per bot, both pointing to the same repo with different start commands (`npm run start:rank` / `npm run start:main`)
- Environment variables (`MONGODB_URI`, `RANK_TOKEN`, `MAIN_TOKEN`) set in Railway dashboard

---

## Phase 1 — Foundation

- Structured error handling with `process.on('unhandledRejection')` and `process.on('uncaughtException')`
- Custom logger (`logger.js`) with timestamped file output to `logs/`
- Modular command architecture: `commands/rank/*.js` and `commands/main/**/*.js`
- `nixpacks.toml` — installs `fonts-liberation` apt package on Railway for canvas font rendering
- Bundled `fonts/LiberationSans-Regular.ttf` — metric-compatible Arial substitute for Railway (Linux)
- Font registered via `GlobalFonts.registerFromPath()` from `@napi-rs/canvas`

---

## Phase 2 — MongoDB Atlas Migration

- **Before**: JSON flat-file storage (`rank_data.json`, `data.json`)
- **After**: MongoDB Atlas (shared cluster) via Mongoose

### Files created
| File | Purpose |
|---|---|
| `utils/db.js` | Cached Mongoose connection, Google DNS override for c-ares SRV issue |
| `utils/models/Member.js` | Unified Mongoose schema for all bot data |
| `utils/dataManager.js` | Rank bot data helpers (`getMember`, `addXP`, `addVoiceXP`, `calcLevel`) |
| `utils/mainData.js` | Main bot data helpers (`getMember`, `updateMember`) |
| `migrate.js` | One-time migration script — merged 45 users from both JSON files into Atlas |

### Member schema fields
```
_id            String   (Discord User ID)
xp             Number   (message XP)
voiceXp        Number   (voice session XP)
lastMsg        Number   (timestamp, for XP cooldown)
lastDailyClaim Number   (timestamp, for daily command)
warns          Array    [{ reason, by, at }]
jail           Object   { reason, jailedBy, timestamp, rolesSnapshot[] } | null
isSas          Boolean  (SAS/suspect flag)
staffStats     Object   { verificationsDone, jailsDone }
timeouts       Array    [{ reason, by, at, duration }]
```

### DNS fix
Local WiFi routers refuse Node.js c-ares SRV queries to MongoDB Atlas. Fixed by:
```js
require('dns').setServers(['8.8.8.8', '8.8.4.4']);
```
Added to `utils/db.js` and `migrate.js`.

---

## Phase 3 — Enhancements

### Phase 3.1 — Anti-Abuse Features

| Feature | File | Details |
|---|---|---|
| Command cooldowns | `utils/cooldownManager.js` | In-memory Map, `userId:cmd` key, auto-cleanup via `setTimeout` |
| Role hierarchy | `utils/permissions.js` | `canModerate()` — blocks moderating equal/higher roles or server owner |
| Anti-spam | `utils/antiSpam.js` | Sliding window: 5 messages in 3s → 5-minute Discord timeout, returns `true` if flagged |
| Voice hop prevention | `rank_bot.js` | `voiceStateUpdate` tracks sessions; XP only awarded on clean leave, not channel switches |

Anti-spam integrated into both bots' `messageCreate`. Rank bot skips XP grant if `antiSpam.check()` returns `true`.

---

### Phase 3.2 — Voice XP Bar

- Added `voiceXp` field to Member schema
- `addVoiceXP(userId, amount)` added to `dataManager.js` — increments `voiceXp` only, no role logic
- Voice sessions now call `addVoiceXP` instead of `addXP` (voice XP is separate from message XP)
- Rank card (`commands/rank/rank.js`) extended: H 220 → 285px
- New full-width "Voice Level" panel at bottom of card with progress bar using same accent color theme
- Bar always renders (outlined track visible at 0%, fills as XP accumulates)

---

### Phase 3.3 — New Commands & Log Channels

#### New commands
| Command | Bot | Description |
|---|---|---|
| `=daily` / `=claim` | Rank | 24h cooldown, awards 50–150 random XP, shows remaining time if on cooldown |
| `+modlogs @user` / `+ml` | Main | Paginated mod history (warns + jail + timeouts), 5 per page, ◀️ ▶️ buttons, admin-only |

#### Log channels wired (from `FAWDA_all_ids.txt`)
| Action | Channel | ID |
|---|---|---|
| `+timeout` | `🕛│timeout・logs` | `1487865949179875348` |
| `+warn` / `+unwarn` | `📛│warn・log` | `1487865951977214214` |
| `+jail` / `+unjail` | `💼│jail・log` | `1487865590575005766` |

All log sends use `guild.channels.fetch(id)` (API call, avoids cache miss) with `log.error` on failure (visible in Railway logs).

`LOG_CHANNELS` constant added to `utils/mainConstants.js`.

---

### Phase 3.4 — QoL Improvements

| File | Change |
|---|---|
| `commands/rank/lb.js` | Fetches top 50, shows 10/page, ◀️ ▶️ buttons (author-only), buttons disabled on 60s timeout |
| `commands/rank/resetxp.js` | Confirmation prompt before reset — ✅ Confirm (red) / ❌ Cancel (grey), 15s timeout |
| `commands/main/moderation/ms7.js` | Confirmation shows message count — on confirm: bulk deletes + 4s auto-delete notice; cancel/timeout clean up |

---

## Phase 4 — Dashboard (In Progress)

A Next.js staff dashboard for viewing and managing bot data without Discord commands.

### Stack
- **Next.js 16** — App Router, TypeScript, Tailwind CSS
- **next-auth v4** — Discord OAuth2 (`identify` + `guilds.members.read` scopes)
- **Mongoose** — shared models with the bots

### Auth flow
1. User logs in with Discord
2. JWT callback fetches `GET /users/@me/guilds/{GUILD_ID}/member` using the user's OAuth token
3. Checks if role `1487864597795966976` (Staff) is present → stores `isStaff` in JWT
4. `middleware.ts` protects `/staff/*` — redirects non-staff (or unauthenticated) to `/`

### Files created
```
dashboard/
├── lib/
│   ├── mongodb.ts              ← cached Mongoose connection via globalThis
│   └── models/
│       └── Member.ts           ← typed schema matching bot (all fields + interfaces)
├── app/
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts    ← NextAuth config, Discord provider, JWT/session callbacks
├── types/
│   └── next-auth.d.ts          ← augments Session + JWT with isStaff, discordId
└── middleware.ts                ← protects /staff/* routes
```

### Environment variables (`dashboard/.env.local`)
```
MONGODB_URI=...
DISCORD_CLIENT_ID=1502087324614525078
DISCORD_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
GUILD_ID=1480956937058390056
NEXTAUTH_URL=http://localhost:3000
```

Redirect URI registered in Discord Developer Portal:
`http://localhost:3000/api/auth/callback/discord`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Discord library | discord.js v14 |
| Canvas rendering | @napi-rs/canvas |
| Database | MongoDB Atlas (Mongoose) |
| Bot hosting | Railway |
| Dashboard framework | Next.js 16 (App Router) |
| Dashboard auth | next-auth v4 (Discord OAuth2) |
| Dashboard hosting | Vercel (planned) |
| Font | Liberation Sans (bundled TTF) |

---

## Project Structure

```
C:\Users\LENOVO\OneDrive\Bureau\
│
├── rank_bot.js                     ← Rank bot entry point
├── main_bot.js                     ← Main bot entry point
├── logger.js                       ← Shared timestamped file logger
├── nixpacks.toml                   ← Railway build config (fonts-liberation)
├── package.json
├── .env                            ← MONGODB_URI, RANK_TOKEN, MAIN_TOKEN
│
├── fonts/
│   └── LiberationSans-Regular.ttf  ← Bundled font for Railway canvas
│
├── commands/
│   ├── rank/
│   │   ├── rank.js                 ← Rank card (canvas, two-panel + voice bar)
│   │   ├── lb.js                   ← Paginated leaderboard (top 50, 10/page)
│   │   ├── daily.js                ← Daily XP reward (50–150 XP, 24h cooldown)
│   │   ├── resetxp.js              ← XP reset with confirmation prompt
│   │   ├── givexp.js
│   │   └── help.js
│   └── main/
│       ├── moderation/
│       │   ├── warn.js             ← Warn + role assignment + warn log
│       │   ├── unwarn.js           ← Remove last warn + warn log
│       │   ├── jail.js             ← Jail + role snapshot + jail log
│       │   ├── unjail.js           ← Unjail + role restore + jail log
│       │   ├── timeout.js          ← Discord timeout + timeout log + DB record
│       │   ├── modlogs.js          ← Paginated mod history (admin only)
│       │   └── ms7.js              ← Bulk delete with confirmation
│       ├── verification/
│       │   ├── vb.js / vg.js       ← Verify boy / verify girl
│       │   └── sas.js / unsas.js   ← SAS flag management
│       └── voice/
│           └── aji.js              ← Voice channel management
│
├── utils/
│   ├── db.js                       ← Mongoose connection (Google DNS override)
│   ├── dataManager.js              ← Rank bot: getMember, addXP, addVoiceXP, calcLevel
│   ├── mainData.js                 ← Main bot: getMember, updateMember
│   ├── mainConstants.js            ← Roles, colors, LOG_CHANNELS
│   ├── constants.js                ← Rank bot constants, XP config, rank roles
│   ├── mainHelpers.js              ← hasStaffPerms, errEmbed, ft, resolveUser
│   ├── permissions.js              ← canModerate() role hierarchy check
│   ├── cooldownManager.js          ← In-memory command cooldown Map
│   ├── antiSpam.js                 ← Sliding window spam detection + auto-timeout
│   └── models/
│       └── Member.js               ← Mongoose schema (shared by both bots)
│
└── dashboard/                      ← Next.js staff dashboard (Phase 4)
    ├── app/
    │   └── api/auth/[...nextauth]/
    │       └── route.ts
    ├── lib/
    │   ├── mongodb.ts
    │   └── models/Member.ts
    ├── types/next-auth.d.ts
    ├── middleware.ts
    └── .env.local
```

---

## Git Commits (this session)

| Commit | Description |
|---|---|
| `Phase 1` | Font fix, nixpacks.toml, bundled Liberation Sans |
| `Phase 2` | MongoDB Atlas migration, Mongoose schemas, migrate.js |
| `Phase 3.1` | Anti-abuse: cooldowns, role hierarchy, anti-spam |
| `Phase 3.2` | Voice XP bar, spam XP prevention |
| `Phase 3.3` | Daily command, modlogs, log channels |
| `Phase 3.4` | Paginated leaderboard, confirmation prompts |
| `Phase 4` | Next.js dashboard scaffold (auth only, no pages yet) |
