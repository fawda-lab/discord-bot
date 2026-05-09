function canModerate(executor, target) {
    if (target.id === target.guild.ownerId) return false;
    const executorTop = executor.roles.highest.position;
    const targetTop   = target.roles.highest.position;
    return executorTop > targetTop;
}

module.exports = { canModerate };
