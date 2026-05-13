const path = require('path');

const C = {
    VERIF:   0x57F287,
    GIRL:    0xFF79C6,
    JAIL:    0xED4245,
    WARN:    0xFEE75C,
    TIMEOUT: 0xEB459E,
    VOICE:   0x5865F2,
    INFO:    0x5865F2,
    GOLD:    0xF1C40F,
    ERROR:   0xED4245,
    MUTED:   0x99AAB5,
};

const ROLES = {
    BOY:         '1487864723096473813',
    GIRL:        '1487864722257743932',
    MALE:        '1487864724585451582',
    FEMALE:      '1487864725470449684',
    UNVERIFIED:  '1487864723839123539',
    VERIF:       '1487864605660151849',
    JAIL:        '1487864720596799688',
    FIRST_WARN:  '1487864728104468580',
    SECOND_WARN: '1487864727328784475',
    LAST_WARN:   '1487864726439591996',
    MUTED:       '1487864718117834964',
    STAFF:       '1487864597795966976',
};

const GAME_ROLES = {
    pes: '1487864760417652858', amongus: '1487864741262004435',
    freefire: '1487864742621216920', codenames: '1487864758060322976',
    lol: '1487864750833401916', valorant: '1487864751890501743',
    plato: '1487864760102948934', minecraft: '1487864749176918216',
    stumbleguys: '1487864747612180602', brawlhalla: '1487864746635169933',
    csgo: '1487864749986156657', roblox: '1487864756458225807',
    pubg: '1487864745565622293', parchisi: '1487864763307393125',
    fifa: '1487864758802845797', gta: '1487864744147947691',
    cod: '1487864745049722920', fortnite: '1489995710362288309',
    monopoly: '1487864754591760406', bloodstrike: '1487864761692459110',
    chess: '1487864757271789708',
};

const JAILER_ROLES = [
    '1487864591198195722', // Assistant Girls 🎀
    '1487864585317912647', // Moderator Girl
    '1487864584294498314', // Moderator
    '1487864583606767766', // Head Of Girls
    '1487864579596877874', // Head Of Moderator
    '1487864577864630465', // Administrator Girl
    '1487864577134952601', // Administrator
    '1487864575591452825', // Head Of Admins
    '1487864567525539961', // Community Manager
];

const LOG_CHANNELS = {
    TIMEOUT: '1487865949179875348',
    WARN:    '1487865951977214214',
    JAIL:    '1487865590575005766',
    UNJAIL:  '1487865594215665704',
    BAN:     '1487865961825439924',
    UNBAN:   '1487865965256638554',
    MOVE:    '1487865983195676892',
    ALL:     '1487865959606784031',
};

const OWNER_ROLES = [
    '1487864551226478674',
    '1487864552275312722',
];

const TEAMS = [
    { name: 'Verification',    headRoles: ['1487864604699660450'],                                      teamRole: '1487864605660151849' },
    { name: 'Need Help',       headRoles: ['1487864607765823640'],                                      teamRole: '1487864609137496124' },
    { name: 'Moderation',      headRoles: ['1487864579596877874'],                                      teamRole: '1487864584294498314' },
    { name: 'Moderation Girl', headRoles: ['1487864579596877874', '1487864583606767766'],               teamRole: '1487864585317912647' },
    { name: 'Girls Staff',     headRoles: ['1487864583606767766'],                                      teamRole: '1487864598941007923' },
    { name: 'Assistant Girls', headRoles: ['1487864583606767766'],                                      teamRole: '1487864591198195722' },
    { name: 'Staff Team',      headRoles: ['1487864575591452825'],                                      teamRole: '1487864597795966976' },
    { name: 'Trial Staff',     headRoles: ['1487864584294498314'],                                      teamRole: '1487864601688412323' },
];

module.exports = {
    TOKEN:         process.env.MAIN_TOKEN,
    PREFIX:        '!',
    DATA_FILE:     path.join(__dirname, '..', 'data.json'),
    RAYSS_ID:      '1430652121375838254',
    ONE_TAP_1:     '1487866287278260234',
    GAME_COOLDOWN: 30 * 60 * 1000,
    C, ROLES, GAME_ROLES, JAILER_ROLES, LOG_CHANNELS, OWNER_ROLES, TEAMS,
};
