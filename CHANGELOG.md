# Changelog

## v2.8.0  2026-05-12

- Changed prefixes: Main Bot `+` → `!` / Rank Bot `=` → `.`

## v1.0.0  2026-05-11

### Phase 1  Foundation

- Error handling with graceful shutdown
- Shared logger with timestamped file output
- Modular command architecture

### Phase 2  MongoDB Migration

- Migrated from JSON flat files to MongoDB Atlas
- Mongoose schemas with atomic operations
- DNS fix for local development

### Phase 3  Enhancements

- Command cooldowns and anti-spam system
- Role hierarchy enforcement for moderation
- Voice XP tracking with rank card integration
- Daily XP rewards command
- Paginated leaderboard and mod logs
- Confirmation prompts for destructive actions
- Log channels for warn/jail/timeout actions

### Phase 4  Web Dashboard

- Next.js dashboard with Discord OAuth2
- Public leaderboard page
- Staff-only mod logs with search
- MongoDB shared between bots and dashboard
