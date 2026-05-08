# FAWDA Discord Bots — Documentation

> Dernière mise à jour : 7 mai 2026
> Language : JavaScript (discord.js v14)
> Hébergement : Local / Wispbyte

---

## Vue d'ensemble — 4 Bots

| Bot | Fichier | Préfixe | Statut |
|-----|---------|---------|--------|
| Main Bot | `fawda main bot/main_bot.js` | `+` | ✅ En ligne |
| Clan Manager | `fawda discord bot/clan_bot.js` | `&` | ⏳ Token manquant |
| Fawda Temp | `fawda temp bot/temp_bot.js` | `.v ` | ⏳ Token manquant |
| ID Fetcher | `id fetcher bot/id_bot.js` | `!` | ✅ Token configuré |

---

## Serveur FAWDA — IDs Importants

```
Guild ID        : 1480956937058390056
Owner ID        : 1430652121375838254
```

---

## Bot 1 — Main Bot

**Fichier :** `c:\Users\LENOVO\OneDrive\Bureau\fawda main bot\main_bot.js`
**Token :** Configuré ✅
**Data :** `data.json`

### Rôles configurés

| Rôle | ID |
|------|----|
| Verified (Boy) | 1487864723096473813 |
| Verified Female (Girl) | 1487864722257743932 |
| Unverified | 1487864723839123539 |
| Ejected (Jail) | 1487864720596799688 |
| First Warn | 1487864728104468580 |
| Second Warn | 1487864727328784475 |
| Last Warn | 1487864726439591996 |
| Muted | 1487864718117834964 |
| Staff Team | 1487864597795966976 |

### Rôles de jeux configurés

| Jeu | Commande | ID |
|-----|----------|----|
| Pes Mobile | `+pes` | 1487864760417652858 |
| Among Us | `+among` / `+amongus` | 1487864741262004435 |
| Free Fire | `+ff` / `+freefire` | 1487864742621216920 |
| Codename | `+codenames` | 1487864758060322976 |
| League of Legends | `+lol` | 1487864750833401916 |
| Valorant | `+valo` | 1487864751890501743 |
| Plato | `+plato` | 1487864760102948934 |
| Minecraft | `+mc` / `+minecraft` | 1487864749176918216 |
| Stumble Guys | `+stumble` / `+stumbleguys` | 1487864747612180602 |
| Brawlhalla | `+brawl` / `+brawlhalla` | 1487864746635169933 |
| Cs Go | `+cs` | 1487864749986156657 |
| Roblox | `+roblox` | 1487864756458225807 |
| Pubg Mobile | `+pubg` | 1487864745565622293 |
| Parchisi | `+parchisi` | 1487864763307393125 |
| FIFA | `+fifa` | 1487864758802845797 |
| GTA | `+gta` | 1487864744147947691 |
| Call of Duty | `+cod` | 1487864745049722920 |
| Fortnite | `+fortnite` | 1489995710362288309 |
| Monopoly | `+monopoly` | 1487864754591760406 |
| Bloodstrike | `+bloodstrike` | 1487864761692459110 |
| Chess | `+chess` | 1487864757271789708 |

### Commandes

#### Help
| Commande | Description |
|----------|-------------|
| `+help` | Panel interactif avec boutons cliquables |

#### Vérification
| Commande | Description |
|----------|-------------|
| `+vb [user]` | Vérifie comme Boy |
| `+vg [user]` | Vérifie comme Girl |
| `+sas [user]` | Ajoute à la Sas List |
| `+unsas [user]` | Retire de la Sas List |
| `+saslist` | Affiche la Sas List |
| `+lbvb` | Top 10 staff vérification |

#### Jail
| Commande | Description |
|----------|-------------|
| `+jail [user] [raison]` | Jail un membre |
| `+unjail [user]` | Unjail comme Boy |
| `+unjail [user] g` | Unjail comme Girl |
| `+jailcase [user]` | Affiche le cas jail |
| `+lbj` | Top 10 jailers |

#### Warn
| Commande | Description |
|----------|-------------|
| `+warn [user] [raison]` | Warn un membre |
| `+unwarn [user]` | Retire 1 warn |
| `+warns [user]` | Affiche les warns |

> Système warn : 1 warn → First Warn role, 2 → Second Warn, 3 → Last Warn, 4+ → Kick automatique

#### Voice
| Commande | Description |
|----------|-------------|
| `+join` | Bot rejoint ton vocal |
| `+vc` | Statistiques du serveur |
| `+aji [user] [#channel]` | Déplace un membre |
| `+vkick [user]` | Kick du vocal |

#### Info
| Commande | Description |
|----------|-------------|
| `+a [user]` | Avatar |
| `+b [user]` | Bannière |
| `+user [user]` | Info membre |
| `+staff [user]` | Info staff |
| `+myinvites` | Tes invitations |
| `+inviteowner [code]` | Propriétaire d'une invite |

#### Jeux (cooldown 30 min/salon)
```
+pes +among +ff +codenames +lol +valo +plato +mc
+stumble +brawl +cs +roblox +pubg +parchisi +fifa
+gta +cod +fortnite +monopoly +bloodstrike +chess
```

---

## Bot 2 — Clan Manager

**Fichier :** `c:\Users\LENOVO\OneDrive\Bureau\fawda discord bot\clan_bot.js`
**Token :** ⏳ À configurer
**Préfixe :** `&`
**Data :** `clans_data.json`

### Rôles configurés
| Rôle | ID |
|------|----|
| Clan Manager | 1487864572663828512 |
| Clan of The Week | 1489995713201836147 |

### Commandes — Clan Manager (Admin)
| Commande | Description |
|----------|-------------|
| `&create [@leader] [nom]` | Créer un clan |
| `&delete [@leader]` | Supprimer un clan |
| `&voice [clanID] [#channel]` | Configurer le vocal du clan |
| `&chat [clanID] [#channel]` | Configurer le chat du clan |
| `&forceaddusers [clanID] [@role]` | Forcer l'ajout par rôle |
| `&clan-of-the-week [clanID]` | Donner le rôle clan of the week |
| `&giveclan [clanID] [@user]` | Transférer un clan |
| `&renameclan [clanID] [nom]` | Renommer un clan |
| `&updaterole [clanID] [@role]` | Mettre à jour le rôle du clan |
| `&update-members-limit [clanID] [n]` | Limite membres |
| `&update-coleaders-limit [clanID] [n]` | Limite co-leaders |
| `&clearcoleaders` | Nettoyer les co-leaders absents |
| `&resetpoints` | Reset tous les points |
| `&restoreclan` | Restaurer les rôles du clan |
| `&clancheck` | Vue d'ensemble des clans |

### Commandes — Clan Leader
| Commande | Description |
|----------|-------------|
| `&adduser [@user]` | Ajouter un membre |
| `&removeuser [@user]` | Retirer un membre |
| `&addcol [@user]` | Ajouter co-leader |
| `&removecol [@user]` | Retirer co-leader |
| `&moveclan` | Déplacer tout le clan en vocal |
| `&nick [@user] [surnom]` | Changer surnom |
| `&setup icon [url]` | Changer l'icône |
| `&setup banner [url]` | Changer la bannière |
| `&setup color [#hex]` | Changer la couleur |
| `&clanrole` | Mentionner le rôle du clan |
| `&set-owner [@user]` | Transférer le leadership |
| `&tag [@user]` | Ajouter le tag au pseudo |
| `&settag [tag]` | Définir le tag du clan |
| `&annc [message]` | Annonce dans le chat clan |

### Commandes — Membre
| Commande | Description |
|----------|-------------|
| `&leave` | Quitter le clan |
| `&info [clanID]` | Infos d'un clan |
| `&myclan` | Infos de ton clan |
| `&list` | Liste tous les clans |
| `&clanlist [clanID]` | Liste membres d'un clan |
| `&mypoints` | Tes points |
| `&mytime` | Ton temps en vocal |

---

## Bot 3 — Fawda Temp (One Tap)

**Fichier :** `c:\Users\LENOVO\OneDrive\Bureau\fawda temp bot\temp_bot.js`
**Token :** ⏳ À configurer
**Préfixe :** `.v `
**Data :** `temp_data.json`

### IDs configurés
| Paramètre | ID |
|-----------|----|
| ONE TAP 1 | 1487866284594040912 |
| ONE TAP 2 | 1487866287278260234 |
| Catégorie CREATE YOUR VOICE | 1487864930513453277 |
| Sweet Booster | 1487864651504025671 |
| Event Manager | 1487864606704668853 |

### Commandes
| Commande | Description | Restriction |
|----------|-------------|-------------|
| `.v panel` | Panel du salon | Owner |
| `.v vcinfo` | Infos du vocal | Tous |
| `.v owner` | Voir le propriétaire | Tous |
| `.v lock / unlock` | Verrouiller/Déverrouiller | Owner |
| `.v hide / unhide` | Cacher/Montrer | Sweet Booster |
| `.v name [nom]` | Renommer | Owner |
| `.v limit [n]` | Limite utilisateurs | Owner |
| `.v permit [@user]` | Autoriser | Owner |
| `.v reject [@user]` | Bannir | Owner |
| `.v permitall` | Accès à tous | Owner |
| `.v permitchat [@user]` | Autoriser le chat | Owner |
| `.v rejectchat [@user]` | Bloquer le chat | Owner |
| `.v lockchat / unlockchat` | Verrouiller le chat | Owner |
| `.v mute / unmute [@user]` | Mute vocal | Sweet Booster |
| `.v fm / fum [@user]` | Force mute/unmute | Sweet Booster |
| `.v permit-role [@role]` | Accès par rôle | Sweet Booster |
| `.v reject-role [@role]` | Bloquer un rôle | Sweet Booster |
| `.v disconnect-all` | Déconnecter tout le monde | Owner |
| `.v invite [@user]` | Inviter en DM | Owner |
| `.v claim` | Prendre ownership | Tous |
| `.v transfer [@user]` | Transférer ownership | Owner |
| `.v save` | Sauvegarder les paramètres | Owner |
| `.v reset` | Reset les permissions | Owner |
| `.v top` | Mettre en haut | Event Manager |
| `.v cam-on / cam-off` | Cam/Stream | Owner |
| `.v sb-on / sb-off` | SoundBoard | Owner |
| `.v activity-on / off` | Activités | Owner |
| `.v bl add/remove/show/clear` | Blacklist | Owner |
| `.v wl add/remove/show/clear` | Whitelist | Owner |
| `.v man add/remove/show/clear` | Managers | Owner |
| `.v clear [n]` | Supprimer messages | Owner |
| `.v freezechannel` | Geler le salon | Owner |
| `.v unfreezechannel` | Dégeler le salon | Owner |
| `.v freezelist` | Liste des gelés | Tous |
| `.v clearfrozen` | Dégeler tout | Admin |

---

## Bot 4 — ID Fetcher

**Fichier :** `c:\Users\LENOVO\OneDrive\Bureau\id fetcher bot\id_bot.js`
**Token :** Configuré ✅
**Préfixe :** `!`

### Commandes
| Commande | Description |
|----------|-------------|
| `!ids` | Info serveur (Guild ID, Owner...) |
| `!roles` | Tous les rôles + IDs |
| `!channels` | Tous les salons par catégorie |
| `!categories` | Catégories uniquement |
| `!emojis` | Emojis personnalisés |
| `!members` | Tous les membres (fichier .txt) |
| `!allids` | Tout en un seul fichier .txt |
| `!id [@mention / nom]` | Chercher un ID précis |

---

## Lancer les bots

```bash
# Main Bot
cd "c:\Users\LENOVO\OneDrive\Bureau\fawda main bot"
npm install
node main_bot.js

# Clan Bot
cd "c:\Users\LENOVO\OneDrive\Bureau\fawda discord bot"
npm install
node clan_bot.js

# Temp Bot
cd "c:\Users\LENOVO\OneDrive\Bureau\fawda temp bot"
npm install
node temp_bot.js

# ID Fetcher
cd "c:\Users\LENOVO\OneDrive\Bureau\id fetcher bot"
npm install
node id_bot.js
```

---

## Prochaines étapes

- [ ] Ajouter le token du **Clan Bot**
- [ ] Ajouter le token du **Temp Bot**
- [ ] Configurer les intents dans le Discord Developer Portal pour chaque bot
- [ ] Héberger sur Wispbyte

---

## Notes importantes

- **Rate limit :** Délai de 500ms entre chaque appel API dans les boucles
- **Intents requis :** `GuildMembers`, `MessageContent`, `GuildVoiceStates` — à activer dans le Developer Portal
- **Data :** Toutes les données sont stockées en JSON local (pas de base de données)
- **Ne jamais partager les tokens** publiquement
