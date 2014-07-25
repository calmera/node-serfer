
module.exports.versions = {
    maxIPCVersion : 1
};

module.exports.commands = {
    handshakeCommand       : "handshake",
    eventCommand           : "event",
    forceLeaveCommand      : "force-leave",
    joinCommand            : "join",
    membersCommand         : "members",
    membersFilteredCommand : "members-filtered",
    streamCommand          : "stream",
    stopCommand            : "stop",
    monitorCommand         : "monitor",
    leaveCommand           : "leave",
    installKeyCommand      : "install-key",
    useKeyCommand          : "use-key",
    removeKeyCommand       : "remove-key",
    listKeysCommand        : "list-keys",
    tagsCommand            : "tags",
    queryCommand           : "query",
    respondCommand         : "respond",
    authCommand            : "auth",
    statsCommand           : "stats"
};

module.exports.errors = {
    unsupportedCommand    : "Unsupported command",
    unsupportedIPCVersion : "Unsupported IPC version",
    duplicateHandshake    : "Handshake already performed",
    handshakeRequired     : "Handshake required",
    monitorExists         : "Monitor already exists",
    invalidFilter         : "Invalid event filter",
    streamExists          : "Stream with given sequence exists",
    invalidQueryID        : "No pending queries matching ID",
    authRequired          : "Authentication required",
    invalidAuthToken      : "Invalid authentication token"
};

module.exports.queryRecord = {
    queryRecordAck      : "ack",
    queryRecordResponse : "response",
    queryRecordDone     : "done"
};
