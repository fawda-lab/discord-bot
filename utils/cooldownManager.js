const timestamps = new Map(); // key: `${userId}:${commandName}` → expiry timestamp

function check(userId, commandName, cooldownSeconds) {
    const key    = `${userId}:${commandName}`;
    const expiry = timestamps.get(key);
    if (!expiry || Date.now() >= expiry) return { onCooldown: false, remainingSeconds: 0 };
    const remainingSeconds = Math.ceil((expiry - Date.now()) / 1000);
    return { onCooldown: true, remainingSeconds };
}

function set(userId, commandName, cooldownSeconds) {
    const key = `${userId}:${commandName}`;
    timestamps.set(key, Date.now() + cooldownSeconds * 1000);
    // auto-clean after expiry so the Map doesn't grow forever
    setTimeout(() => timestamps.delete(key), cooldownSeconds * 1000);
}

module.exports = { check, set };
