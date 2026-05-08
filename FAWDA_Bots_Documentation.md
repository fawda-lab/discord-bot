# FAWDA Discord Bots — Documentation Complète

> Dernière mise à jour : 8 mai 2026 — v2.7
> Language : JavaScript (discord.js v14)
> Hébergement : Local (Windows) / futur Wispbyte
> Shell : PowerShell (Windows 11)

---

## RÈGLE IMPORTANTE

> **Chaque fois qu'un fichier bot est modifié, ce fichier MD doit être mis à jour** (version bump + changements décrits). Ce fichier est la source de vérité pour reconstituer le contexte en cas de compaction.

---

## Vue d'ensemble — 4 Bots

| Bot | Fichier absolu | Préfixe | Token | Statut |
|-----|----------------|---------|-------|--------|
| Main Bot | `c:\Users\LENOVO\OneDrive\Bureau\fawda main bot\main_bot.js` | `+` | ✅ Configuré dans le fichier | ✅ En ligne |
| Rank Bot | `c:\Users\LENOVO\OneDrive\Bureau\fawda rank bot\rank_bot.js` | `=` | ⏳ À configurer | ⏳ Offline |
| Clan Manager | `c:\Users\LENOVO\OneDrive\Bureau\fawda discord bot\clan_bot.js` | `&` | ⏳ À configurer | ⏳ Offline |
| Fawda Temp | `c:\Users\LENOVO\OneDrive\Bureau\fawda temp bot\temp_bot.js` | `.v ` | ⏳ À configurer | ⏳ Offline |
| ID Fetcher | `c:\Users\LENOVO\OneDrive\Bureau\id fetcher bot\id_bot.js` | `!` | ✅ Configuré dans le fichier | ✅ En ligne |

**Data files :**
- Main Bot → `c:\Users\LENOVO\OneDrive\Bureau\fawda main bot\data.json`
- Rank Bot → `c:\Users\LENOVO\OneDrive\Bureau\fawda rank bot\rank_data.json`
- Clan Bot → `c:\Users\LENOVO\OneDrive\Bureau\fawda discord bot\clans_data.json`
- Temp Bot → `c:\Users\LENOVO\OneDrive\Bureau\fawda temp bot\temp_data.json`

---

## Serveur FAWDA — Infos globales

```
Guild ID   : 1480956937058390056
Owner ID   : 1430652121375838254
Owner tag  : rayss_lmo2assiss
```

---

## Intents Discord requis (Developer Portal)

Pour chaque bot → Developer Portal → Application → Bot → activer :
- ✅ PRESENCE INTENT
- ✅ SERVER MEMBERS INTENT
- ✅ MESSAGE CONTENT INTENT

Sans ces intents → erreur `Used disallowed intents` au démarrage.

---

## BOT 1 — Main Bot

### Fichier
`c:\Users\LENOVO\OneDrive\Bureau\fawda main bot\main_bot.js`

### Config du code (constantes en haut du fichier)

```js
const TOKEN  = '...'   // token configuré
const PREFIX = '+'
const DATA_FILE = 'data.json'
```

### Objet ROLES (dans le code)

```js
const ROLES = {
    BOY:         '1487864723096473813',  // Verified
    GIRL:        '1487864722257743932',  // Verified Female
    MALE:        '1487864724585451582',  // Male
    FEMALE:      '1487864725470449684',  // Female
    UNVERIFIED:  '1487864723839123539',  // Unverified
    JAIL:        '1487864720596799688',  // Ejected
    FIRST_WARN:  '1487864728104468580',  // First Warn
    SECOND_WARN: '1487864727328784475',  // Second Warn
    LAST_WARN:   '1487864726439591996',  // Last Warn
    MUTED:       '1487864718117834964',  // Muted
    STAFF:       '1487864597795966976',  // Staff Team
    VERIF:       '1487864605660151849',  // Verification (role staff verif)
};
```

### Objet GAME_ROLES (dans le code)

```js
const GAME_ROLES = {
    pes:         '1487864760417652858',
    amongus:     '1487864741262004435',
    freefire:    '1487864742621216920',
    codenames:   '1487864758060322976',
    lol:         '1487864750833401916',
    valorant:    '1487864751890501743',
    plato:       '1487864760102948934',
    minecraft:   '1487864749176918216',
    stumbleguys: '1487864747612180602',
    brawlhalla:  '1487864746635169933',
    csgo:        '1487864749986156657',
    roblox:      '1487864756458225807',
    pubg:        '1487864745565622293',
    parchisi:    '1487864763307393125',
    fifa:        '1487864758802845797',
    gta:         '1487864744147947691',
    cod:         '1487864745049722920',
    fortnite:    '1489995710362288309',
    monopoly:    '1487864754591760406',
    bloodstrike: '1487864761692459110',
    chess:       '1487864757271789708',
};
const GAME_COOLDOWN = 30 * 60 * 1000; // 30 minutes par salon
```

### Aliases jeux (gameMap dans le code)

| Alias tapé | Clé interne |
|-----------|------------|
| `pes` | pes |
| `among`, `amongus` | amongus |
| `ff`, `freefire` | freefire |
| `codenames` | codenames |
| `lol` | lol |
| `valo`, `valorant` | valorant |
| `plato` | plato |
| `mc`, `minecraft` | minecraft |
| `stumble`, `stumbleguys` | stumbleguys |
| `brawl`, `brawlhalla` | brawlhalla |
| `cs` | csgo |
| `roblox` | roblox |
| `pubg` | pubg |
| `parchisi` | parchisi |
| `fifa` | fifa |
| `gta` | gta |
| `cod` | cod |
| `fortnite` | fortnite |
| `monopoly` | monopoly |
| `bloodstrike` | bloodstrike |
| `chess` | chess |

### Palette de couleurs (objet `C` dans le code)

```js
const C = {
    VERIF:   0x57F287,  // vert  — vérification, succès
    GIRL:    0xFF79C6,  // rose  — commandes +vg
    JAIL:    0xED4245,  // rouge — jail, erreurs, bulk delete
    WARN:    0xFEE75C,  // jaune — warn 1, cooldown, sas
    TIMEOUT: 0xEB459E,  // fuchsia — timeout
    VOICE:   0x5865F2,  // blurple — voice, help panel
    INFO:    0x5865F2,  // blurple — info, invites, avatar
    GOLD:    0xF1C40F,  // or — leaderboards
    ERROR:   0xED4245,  // rouge — tous les errEmbed()
    MUTED:   0x99AAB5,  // gris
};
```

### Fonctions de design (helpers dans le code)

```js
// Footer standardisé avec l'avatar et le nom du bot
function ft(client) { return { text: 'FAWDA Bot', iconURL: client.user.displayAvatarURL() }; }

// Embed d'erreur rouge uniforme
function errEmbed(text) { return new EmbedBuilder().setColor(C.ERROR).setDescription(`❌  ${text}`); }

// Barre de progression warn : 🟥🟥⬜ (3 cases)
function warnBar(count) {
    const filled = Math.min(count, 3);
    return '🟥'.repeat(filled) + '⬜'.repeat(3 - filled);
}

// Couleur dynamique selon le nombre de warns
function warnColor(count) {
    if (count >= 3) return C.JAIL;   // rouge foncé
    if (count === 2) return 0xFF7043; // orange
    return C.WARN;                    // jaune
}

// Médailles pour les top 3 dans les leaderboards
const MEDALS = ['🥇', '🥈', '🥉'];
function rank(i) { return MEDALS[i] ?? `**${i+1}.**`; }
```

**Structure des embeds modération** (jail, warn, timeout) :
- `.setAuthor({ name: member.displayName, iconURL: … })` — staff qui exécute
- `.setThumbnail(target.user.displayAvatarURL())` — avatar de la cible
- `.setFooter(ft(client))` — footer FAWDA Bot
- `.setTimestamp()` — heure de l'action
- `.addFields(…)` — détails (membre, raison, by, etc.)

### Système de permissions (fonctions dans le code)

```js
// Pour commandes jail / warn / voice (kick/move) / aji
function hasStaffPerms(member) {
    if (Administrator) return true;
    if (ROLES.STAFF dans ses rôles) return true;
    return ManageMessages;
}

// Pour commandes vérification uniquement (+vb, +vg, +sas, +unsas)
function hasVerifPerms(member) {
    if (Administrator) return true;
    if (ROLES.STAFF dans ses rôles) return true;
    if (ROLES.VERIF dans ses rôles) return true;
    return false;
}
```

**Résumé accès par commande :**

| Commandes | Qui peut l'utiliser |
|-----------|-------------------|
| `+vb`, `+vg`, `+sas`, `+unsas` | Admin · Staff Team · **Verification role** |
| `+saslist`, `+lbvb` | Tout le monde |
| `+jail`, `+unjail`, `+jailcase`, `+lbj` | Admin · Staff Team |
| `+warn`, `+unwarn`, `+warns` | Admin · Staff Team |
| `+timeout`, `+ms7` | Admin · Staff Team |
| `+aji`, `+vkick`, `+join` | Admin · Staff Team |
| `+ot` | Tout le monde |
| `+vc`, `+a`, `+b`, `+user`, `+staff`, `+myinvites`, `+inviteowner` | Tout le monde |
| Commandes jeux | Tout le monde (cooldown 30 min/salon) |

### Structure data.json

```json
{
  "warns": {
    "USER_ID": {
      "count": 2,
      "reasons": [
        { "reason": "raison", "by": "STAFF_ID", "at": "ISO_DATE" }
      ]
    }
  },
  "jailed": {
    "USER_ID": {
      "reason": "raison",
      "jailedBy": "STAFF_ID",
      "rolesSnapshot": ["ROLE_ID1", "ROLE_ID2"],
      "timestamp": "ISO_DATE"
    }
  },
  "sasList": ["USER_ID1", "USER_ID2"],
  "verifications": {
    "STAFF_ID": 5
  },
  "jailActions": {
    "STAFF_ID": 3
  }
}
```

---

### Commandes détaillées — Main Bot

#### `+help`
Envoie un embed avec 2 rangées de boutons cliquables (éphémères) :
- Rangée 1 : `Verification` · `Jail` · `Warn` · `Voice` · `Info`
- Rangée 2 : `Games` · `Save All Commands In Dm`
- Le bouton DM envoie toutes les commandes en message privé

---

#### TIMEOUT (permission : `hasStaffPerms`)

**`+timeout [@user] [durée] [raison]`** — Logique exacte :
1. Parse la durée : `10s` / `10m` / `1h` / `1d` (défaut : minutes si pas d'unité)
2. Max 28 jours (limite Discord)
3. Appelle `target.timeout(ms, reason)`
4. Envoie un DM au membre
5. Répond embed orange "⏱️ Timeout" avec membre, durée, raison, auteur

Exemple : `+timeout @user 10m spam` = timeout 10 minutes pour "spam"

---

#### VÉRIFICATION (permission : `hasVerifPerms`)

**`+vb [@user]`**
1. Ajoute le rôle `BOY` (Verified)
2. Ajoute le rôle `MALE` (Male)
3. Retire le rôle `UNVERIFIED`
4. Incrémente `data.verifications[staff.id]`
5. Répond avec embed bleu "✅ Verified as Boy"

**`+vg [@user]`**
1. Ajoute le rôle `GIRL` (Verified Female)
2. Ajoute le rôle `FEMALE` (Female)
3. Retire le rôle `UNVERIFIED`
4. Incrémente `data.verifications[staff.id]`
5. Répond avec embed rose "✅ Verified as Girl"

**`+sas [@user]`** — Ajoute l'user à `data.sasList[]` (liste de surveillance)

**`+unsas [@user]`** — Retire l'user de `data.sasList[]`

**`+saslist`** — Affiche tous les membres dans `data.sasList[]`

**`+lbvb`** — Top 10 staff triés par `data.verifications` décroissant

---

#### JAIL (permission : `hasStaffPerms`)

**`+jail [@user] [raison]`**
1. Retire TOUS les rôles du membre (sauf @everyone et JAIL)
2. Ajoute le rôle `JAIL` (Ejected)
3. Sauvegarde dans `data.jailed[user.id]` : raison, qui a jail, snapshot des rôles, timestamp
4. Incrémente `data.jailActions[staff.id]`
5. Envoie DM au membre
6. Répond avec embed rouge

**`+unjail [@user]`** — Retire JAIL, ajoute BOY
**`+unjail [@user] g`** — Retire JAIL, ajoute GIRL
Supprime `data.jailed[user.id]`

**`+jailcase [@user]`** — Affiche raison, jaileur, timestamp depuis `data.jailed`

**`+lbj`** — Top 10 jaileurs triés par `data.jailActions` décroissant

---

#### WARN (permission : `hasStaffPerms`)

**`+warn [@user] [raison]`** — Logique exacte :
1. Incrémente `data.warns[user.id].count`
2. Retire tous les rôles warn existants (First/Second/Last) du membre
3. Attribue le rôle correspondant au nouveau count :
   - count 1 → `FIRST_WARN`
   - count 2 → `SECOND_WARN`
   - count 3 → `LAST_WARN` **+ `MUTED`**
   - count ≥ 4 → **kick automatique** (`target.kick()`)
4. Sauvegarde la raison dans `data.warns[user.id].reasons[]`
5. Envoie DM au membre
6. Répond embed orange "⚠️ Warn #N"

**`+unwarn [@user]`** — Logique exacte :
1. Décrémente `data.warns[user.id].count` de 1
2. Supprime la dernière raison du tableau `reasons`
3. Retire **TOUS** les rôles warn (First/Second/Last + Muted)
4. Réapplique le rôle correspondant au **nouveau** count :
   - newCount 1 → `FIRST_WARN`
   - newCount 2 → `SECOND_WARN`
   - newCount 3 → `LAST_WARN`
   - newCount 0 → aucun rôle warn

**`+warns [@user]`** — Affiche count + liste toutes les raisons avec auteur

---

#### VOICE (permission : `hasStaffPerms` sauf `+vc`)

**`+join`** — Confirme que le bot rejoint le vocal de l'auteur (informatif)

**`+vc`** — Embed stats serveur : membres total, online, en vocal, salons, rôles, boosts

**`+aji [@user] [#channel]`** — Comportement exact :
- Si `#channel` fourni → déplace le membre vers ce salon vocal
- Si `#channel` absent → déplace le membre vers **le vocal de l'auteur de la commande**
- Si l'auteur n'est pas en vocal → erreur "You are not in a voice channel"
- Si le membre cible n'est pas en vocal → erreur

**`+vkick [@user]`** — Déplace le membre vers `null` (kick du vocal)

**`+ot`** — Déplace **l'auteur de la commande** vers **One Tap 1** (`1487866287278260234`)
- L'auteur doit être dans un salon vocal sinon erreur
- Aucun argument nécessaire
- Permission : **Tout le monde**

**`+ms7 [n]`** — Supprime `n` messages dans le salon courant (1–100)
1. Supprime d'abord le message de commande lui-même (`msg.delete()`)
2. `channel.bulkDelete(n, true)` — ignore les messages > 14 jours
3. Envoie un embed de confirmation rouge qui s'auto-supprime après **4 secondes**
4. Permission : `hasStaffPerms`

---

#### INFO (permission : aucune — tout le monde)

**`+a [@user]`** — Embed avec avatar haute résolution (1024px)

**`+b [@user]`** — Fetch l'user avec `force:true` pour avoir la bannière, affiche en embed

**`+user [@user]`** — Embed : username, ID, joined server, account created, top 10 rôles, bannière si existe

**`+staff [@user]`** — Embed : verifications faites, jails faits, rôles, date joined

**`+myinvites`** — Liste les invites actives créées par l'auteur (code, uses, expiry)

**`+inviteowner [code]`** — Trouve l'invite par code, affiche owner, uses, salon

---

#### JEUX (tout le monde — cooldown 30 min/salon)

Chaque commande mentionne le rôle du jeu correspondant.
Cooldown stocké en mémoire dans `gameCooldowns` (Map) — se reset au redémarrage du bot.
Format réponse : `@RoleJeu — @Auteur is looking for players! 🎮`

---

## BOT 2 — Clan Manager

### Fichier
`c:\Users\LENOVO\OneDrive\Bureau\fawda discord bot\clan_bot.js`

### Config

```
Préfixe       : &
Token         : ⏳ À ajouter dans le fichier (variable TOKEN)
Data file     : clans_data.json
```

### Rôles configurés dans le code

```js
const CLAN_MANAGER_ROLE = '1487864572663828512'  // Clan Manager
const CLAN_OF_WEEK_ROLE = '1489995713201836147'  // Clan of The Week
```

### Structure clans_data.json

```json
{
  "clans": {
    "CLAN_ID": {
      "name": "NomClan",
      "tag": "[TAG]",
      "leaderId": "USER_ID",
      "coLeaders": ["USER_ID"],
      "members": ["USER_ID"],
      "roleId": "ROLE_ID",
      "voiceChannelId": "CHANNEL_ID",
      "chatChannelId": "CHANNEL_ID",
      "membersLimit": 20,
      "coLeadersLimit": 3,
      "points": 0,
      "voiceTime": {},
      "icon": "URL",
      "banner": "URL",
      "color": "#HEX",
      "createdAt": "ISO_DATE"
    }
  }
}
```

### Commandes — Clan Manager (Admin ou rôle Clan Manager)

| Commande | Description |
|----------|-------------|
| `&create [@leader] [nom]` | Crée un clan — génère un clanID auto |
| `&delete [@leader]` | Supprime le clan du leader |
| `&voice [clanID] [#channel]` | Définit le salon vocal du clan |
| `&chat [clanID] [#channel]` | Définit le salon texte du clan |
| `&forceaddusers [clanID] [@role]` | Ajoute tous les membres du rôle au clan |
| `&clan-of-the-week [clanID]` | Donne le rôle Clan of The Week |
| `&giveclan [clanID] [@user]` | Transfère le clan à un autre leader |
| `&renameclan [clanID] [nom]` | Renomme le clan |
| `&updaterole [clanID] [@role]` | Met à jour le rôle Discord lié au clan |
| `&update-members-limit [clanID] [n]` | Change la limite de membres |
| `&update-coleaders-limit [clanID] [n]` | Change la limite de co-leaders |
| `&clearcoleaders` | Supprime les co-leaders qui ont quitté le serveur |
| `&resetpoints` | Remet tous les points à 0 |
| `&restoreclan` | Re-donne les rôles clan à tous les membres |
| `&clancheck` | Vue d'ensemble de tous les clans |

### Commandes — Clan Leader

| Commande | Description |
|----------|-------------|
| `&adduser [@user]` | Ajoute un membre au clan (limite respectée) |
| `&removeuser [@user]` | Retire un membre |
| `&addcol [@user]` | Ajoute un co-leader (limite respectée) |
| `&removecol [@user]` | Retire un co-leader |
| `&moveclan` | Déplace tous les membres du clan dans le vocal clan |
| `&nick [@user] [surnom]` | Change le pseudo Discord d'un membre |
| `&setup icon [url]` | Change l'icône du clan |
| `&setup banner [url]` | Change la bannière du clan |
| `&setup color [#hex]` | Change la couleur de l'embed du clan |
| `&clanrole` | Mentionne le rôle du clan |
| `&set-owner [@user]` | Transfère le leadership |
| `&tag [@user]` | Ajoute le tag clan au pseudo d'un membre |
| `&settag [tag]` | Définit le tag du clan (ex: [FWDA]) |
| `&annc [message]` | Annonce dans le chat clan |

### Commandes — Membre

| Commande | Description |
|----------|-------------|
| `&leave` | Quitte le clan |
| `&info [clanID]` | Affiche infos d'un clan |
| `&myclan` | Affiche infos de son propre clan |
| `&list` | Liste tous les clans du serveur |
| `&clanlist [clanID]` | Liste les membres d'un clan |
| `&mypoints` | Affiche ses points clan |
| `&mytime` | Affiche son temps vocal dans le clan |

---

## BOT 3 — Fawda Temp (One Tap Voice)

### Fichier
`c:\Users\LENOVO\OneDrive\Bureau\fawda temp bot\temp_bot.js`

### Config

```
Préfixe       : .v  (avec espace)
Token         : ⏳ À ajouter dans le fichier (variable TOKEN)
Data file     : temp_data.json
```

### IDs configurés dans le code

```js
const ONE_TAP_CHANNELS  = ['1487866287278260234', '1487866284594040912']  // ONE TAP 1 & 2
const ONE_TAP_CATEGORY  = '1487864930513453277'   // Catégorie CREATE YOUR VOICE
const SWEET_BOOSTER_ROLE = '1487864651504025671'  // Sweet Booster
const EVENT_MANAGER_ROLE = '1487864606704668853'  // Event Manager
```

### Fonctionnement général

- Quand un membre rejoint ONE TAP 1 ou ONE TAP 2 → le bot crée automatiquement un salon vocal dans la catégorie ONE TAP CATEGORY
- Le créateur devient "owner" du salon
- Quand plus personne dans le salon → le bot le supprime automatiquement
- Les paramètres sont stockés dans `temp_data.json`

### Commandes (préfixe `.v `)

| Commande | Description | Restriction |
|----------|-------------|-------------|
| `.v panel` | Panel interactif de gestion du salon | Owner |
| `.v vcinfo` | Infos du salon (owner, membres, limite…) | Tous |
| `.v owner` | Affiche qui est le propriétaire | Tous |
| `.v lock` / `.v unlock` | Verrouille/déverrouille l'accès | Owner |
| `.v hide` / `.v unhide` | Cache/montre le salon | Sweet Booster |
| `.v name [nom]` | Renomme le salon | Owner |
| `.v limit [n]` | Définit la limite d'utilisateurs | Owner |
| `.v permit [@user]` | Autorise un membre | Owner |
| `.v reject [@user]` | Bannit un membre du salon | Owner |
| `.v permitall` | Ouvre l'accès à tout le monde | Owner |
| `.v permitchat [@user]` | Autorise le chat texte du salon | Owner |
| `.v rejectchat [@user]` | Bloque le chat texte | Owner |
| `.v lockchat` / `.v unlockchat` | Verrouille/déverrouille le chat | Owner |
| `.v mute [@user]` / `.v unmute [@user]` | Mute vocal | Sweet Booster |
| `.v fm [@user]` / `.v fum [@user]` | Force mute/unmute | Sweet Booster |
| `.v permit-role [@role]` | Donne accès à tout un rôle | Sweet Booster |
| `.v reject-role [@role]` | Bloque tout un rôle | Sweet Booster |
| `.v disconnect-all` | Déconnecte tout le monde | Owner |
| `.v invite [@user]` | Envoie une invitation en DM | Owner |
| `.v claim` | Prend le ownership (si owner absent) | Tous |
| `.v transfer [@user]` | Transfère le ownership | Owner |
| `.v save` | Sauvegarde les paramètres actuels | Owner |
| `.v reset` | Remet les permissions par défaut | Owner |
| `.v top` | Remonte le salon en haut de la catégorie | Event Manager |
| `.v cam-on` / `.v cam-off` | Active/désactive l'obligation de cam | Owner |
| `.v sb-on` / `.v sb-off` | Active/désactive le SoundBoard | Owner |
| `.v activity-on` / `.v activity-off` | Active/désactive les activités | Owner |
| `.v bl add/remove/show/clear` | Gestion de la blacklist | Owner |
| `.v wl add/remove/show/clear` | Gestion de la whitelist | Owner |
| `.v man add/remove/show/clear` | Gestion des managers du salon | Owner |
| `.v clear [n]` | Supprime n messages dans le chat | Owner |
| `.v freezechannel` | Gèle le salon (personne ne peut rejoindre) | Owner |
| `.v unfreezechannel` | Dégèle le salon | Owner |
| `.v freezelist` | Liste des salons gelés | Tous |
| `.v clearfrozen` | Dégèle tous les salons | Admin |

---

## BOT 4 — ID Fetcher

### Fichier
`c:\Users\LENOVO\OneDrive\Bureau\id fetcher bot\id_bot.js`

### Config

```
Préfixe : !
Token   : ✅ Configuré dans le fichier
```

### Commandes

| Commande | Description | Output |
|----------|-------------|--------|
| `!ids` | Info serveur | Embed (Guild ID, Owner ID, membres, boosts…) |
| `!roles` | Tous les rôles + IDs | Messages paginés |
| `!channels` | Tous les salons par catégorie | Messages paginés |
| `!categories` | Catégories uniquement | Embed |
| `!emojis` | Emojis personnalisés | Embed |
| `!members` | Tous les membres | Fichier `.txt` joint |
| `!allids` | Tout en un | Fichier `.txt` joint (utilisé pour configurer les autres bots) |
| `!id [@mention / nom]` | ID d'un membre précis | Embed |

---

## Lancer les bots

```powershell
# Main Bot
cd "c:\Users\LENOVO\OneDrive\Bureau\fawda main bot"
node main_bot.js

# Clan Bot
cd "c:\Users\LENOVO\OneDrive\Bureau\fawda discord bot"
node clan_bot.js

# Temp Bot
cd "c:\Users\LENOVO\OneDrive\Bureau\fawda temp bot"
node temp_bot.js

# ID Fetcher
cd "c:\Users\LENOVO\OneDrive\Bureau\id fetcher bot"
node id_bot.js
```

> Si première installation : `npm install` avant `node`
> Pour arrêter un bot : `Ctrl + C` dans le terminal
> Les changements de code ne s'appliquent qu'après redémarrage

---

## Notes techniques importantes

### Rate limit
- Délai de `300–500ms` (`await sleep(ms)`) entre chaque appel API dans les boucles
- Exemple : retrait de rôles dans `+jail` → 300ms entre chaque rôle retiré
- Pas de sleep pour les opérations simples (un seul appel)

### Intents requis (code)
```js
GatewayIntentBits.Guilds
GatewayIntentBits.GuildMembers      // Privilégié — activer dans Developer Portal
GatewayIntentBits.GuildMessages
GatewayIntentBits.GuildInvites
GatewayIntentBits.GuildVoiceStates
GatewayIntentBits.MessageContent    // Privilégié — activer dans Developer Portal
```

### Stockage
- Tout en JSON local — pas de base de données
- `loadData()` relit le fichier à chaque commande
- `saveData()` réécrit tout le fichier JSON

### Sécurité
- Ne jamais partager les tokens publiquement
- Les tokens sont hardcodés dans chaque fichier `.js` (variable `TOKEN`)

---

## Historique des modifications

| Version | Date | Changement |
|---------|------|------------|
| v1.0 | 07/05/2026 | Création initiale des 4 bots |
| v1.1 | 07/05/2026 | Fix +vb/+vg (ajout Male/Female), fix +aji (fallback vocal auteur), fix +warn (swap rôles + Muted à warn 3) |
| v1.2 | 07/05/2026 | Ajout rôle Verification — les membres verif peuvent utiliser +vb/+vg/+sas/+unsas |
| v1.3 | 07/05/2026 | MD restructuré avec détails complets pour reconstruction en cas de compaction |
| v1.4 | 07/05/2026 | Ajout `+timeout @user [durée] [raison]` |
| v1.5 | 07/05/2026 | Ajout `+ot` (déplace l'AUTEUR vers One Tap 1 — sans argument) — correction ID `1487866287278260234` |
| v1.6 | 07/05/2026 | Ajout `+ms7 [n]` — bulk delete avec auto-suppression de la confirmation (4s) |
| v1.7 | 07/05/2026 | Fix `+unwarn` — retire tous les rôles warn puis réapplique le bon selon le nouveau count |
| v2.0 | 07/05/2026 | Refonte visuelle complète : palette `C`, helpers `ft()` `errEmbed()` `warnBar()` `warnColor()` `rank()`, embeds modération avec auteur/thumbnail/timestamp, boutons help avec emojis et couleurs, leaderboards avec médailles 🥇🥈🥉 |
| v2.1 | 07/05/2026 | Easter egg : quand quelqu'un mentionne rayss (`1430652121375838254`), le bot répond automatiquement avec `rayss.jpg` (fichier local dans le dossier du bot) |
| v2.2 | 08/05/2026 | Nouveau bot séparé : **Rank Bot** (`fawda rank bot/rank_bot.js`) — préfixe `=`, XP messages + voice, carte cyberpunk "SUBJECT FILE // CLASSIFIED", 10 paliers de rangs (Bronze→Royal), owner = level 9999 |
| v2.3 | 08/05/2026 | Rank Bot — redesign carte GIF : hauteur 490→870px, avatar panel large (330×310), icône serveur centrée, valeurs info-table RIGHT-aligned, "LEVEL X" avec box de fond, barre de progression avec % centré dedans, label "NEURAL SIGNATURE // BIO-METRIC WAVE ANALYSIS", grille de points décoratifs, fix `drawCircuit` reçoit `dotBlink` en paramètre |
| v2.4 | 08/05/2026 | Rank Bot — animation "worm" sur circuit : marching dashes + ghost trail + nodes pulsants via `wavePhase` |
| v2.5 | 08/05/2026 | Rank Bot — worm déplacé sur le border rectangulaire du server panel (`drawWormSquare`) |
| v2.6 | 08/05/2026 | Rank Bot — carte redessinée en **PNG statique** (700×220) : fini le GIF 24 frames, nouveau style deux panneaux arrondis (Level Info + Rank Info), gradient de fond par rang, avatar circulaire, badge XP, barre de progression, warn dots rouges. Tokens migrés vers `process.env.RANK_TOKEN` / `process.env.MAIN_TOKEN`. Projet pushé sur GitHub `fawda-lab/discord-bot`. |
| v2.7 | 08/05/2026 | Rank Bot — labels carte traduits en anglais : "Level Info", "Message Level", "Progress", "Rank Info", "Server Rank", "Total XP" |

---

## Prochaines étapes

- [ ] Ajouter le token du **Clan Bot** dans `clan_bot.js` (variable TOKEN)
- [ ] Ajouter le token du **Temp Bot** dans `temp_bot.js` (variable TOKEN)
- [ ] Activer les intents dans le Discord Developer Portal pour Clan Bot et Temp Bot
- [ ] Héberger sur Wispbyte
