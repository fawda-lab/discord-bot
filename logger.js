const fs   = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, 'logs');
try { fs.mkdirSync(LOGS_DIR, { recursive: true }); } catch {}

const COLOR = {
    INFO:  '\x1b[36m',   // cyan
    WARN:  '\x1b[33m',   // yellow
    ERROR: '\x1b[31m',   // red
    DEBUG: '\x1b[90m',   // gray
    RESET: '\x1b[0m',
};

function timestamp() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    return { date, datetime: `${date} ${time}` };
}

function serialize(a) {
    if (a instanceof Error) return a.stack ?? a.message;
    if (typeof a === 'object' && a !== null) {
        try { return JSON.stringify(a); } catch { return String(a); }
    }
    return String(a);
}

function appendToFile(line, date) {
    try {
        fs.appendFileSync(path.join(LOGS_DIR, `${date}.log`), line + '\n', 'utf8');
    } catch {}
}

module.exports = function createLogger(context) {
    function write(level, args) {
        const { date, datetime } = timestamp();
        const msg    = args.map(serialize).join(' ');
        const prefix = `[${datetime}] [${level}] [${context}]`;
        const plain  = `${prefix} ${msg}`;
        const colored = `${COLOR[level]}${prefix}${COLOR.RESET} ${msg}`;

        const out = level === 'ERROR' ? process.stderr : process.stdout;
        out.write(colored + '\n');
        appendToFile(plain, date);
    }

    return {
        info:  (...args) => write('INFO',  args),
        warn:  (...args) => write('WARN',  args),
        error: (...args) => write('ERROR', args),
        debug: (...args) => write('DEBUG', args),
    };
};
