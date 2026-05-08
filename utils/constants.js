const path = require('path');

module.exports = {
    TOKEN:       process.env.RANK_TOKEN,
    PREFIX:      '=',
    DATA_FILE:   path.join(__dirname, '..', 'rank_data.json'),
    GUILD_ID:    '1480956937058390056',
    OWNER_ID:    '1430652121375838254',
    STAFF_ROLE:  '1487864597795966976',

    MSG_XP_MIN:   15,
    MSG_XP_MAX:   25,
    MSG_COOLDOWN: 60_000,
    VOICE_XP:     10,

    RANKS: [
        { level: 10,  id: '1487864709129568479', name: '»Bronze'       },
        { level: 20,  id: '1487864708336975872', name: '»Epic'         },
        { level: 30,  id: '1487864707560902766', name: '»Celestia'     },
        { level: 40,  id: '1487864706822836254', name: '»Elite'        },
        { level: 50,  id: '1487864706034171954', name: '»Cosmic'       },
        { level: 60,  id: '1487864705232928999', name: '»Master'       },
        { level: 70,  id: '1487864695216934963', name: '»Grand Master' },
        { level: 80,  id: '1487864694256570493', name: '»Champion'     },
        { level: 90,  id: '1487864693493075988', name: '»Hero'         },
        { level: 100, id: '1487864692687765596', name: '»Royal'        },
    ],
};
