var net = require('net'),
    Constants = require('./constants.js'),
    Q = require('q'),
    log = require('winston'),
    SerfRPC = require('./serf-rpc.js');

var defaultTimeout = 10;

var RPCClient = function() {
    this.sequence = 0;

    this.shutdown = false;
};

RPCClient.prototype.connect = function(c) {
    if (!c) c = {};

    if (!c.timeout) c.timeout = defaultTimeout;

    if (!c.host) c.host = 'localhost';
    if (!c.port) c.port = 7373;

    // -- connect to serf
    this.rpc = new SerfRPC();
    return this.rpc.connect(c);
};

RPCClient.prototype.isClosed = function() {
    return this.shutdown;
};

RPCClient.prototype.close = function() {
    if (!this.shutdown) {
        this.shutdown = true;
        this.rpc.stream.removeAllListeners();
        this.rpc.stream.close();
    }

    return null;
};

RPCClient.prototype.forceLeave = function(node) {
    return this.rpc.send(Constants.commands.forceLeaveCommand, {
        Node: node
    });
};

RPCClient.prototype.join = function(addresses, replay) {
    return this.rpc.send(Constants.commands.joinCommand, {
        Existing: addresses,
        Replay: replay
    }).then(function(data) {
        return data['Num'];
    });
};

RPCClient.prototype.members = function() {
    return this.rpc
        .send(Constants.commands.membersCommand)
        .then(function(data) {
            return data['Members'];
        });
};

RPCClient.prototype.membersFiltered = function(tags, status, name) {
    return this.rpc
        .send(Constants.commands.membersCommand, {
            Tags:   tags,
            Status: status,
            Name:   name
        })
        .then(function(data) {
            return data['Members'];
        });
};

// UserEvent is used to trigger sending an event
RPCClient.prototype.userEvent = function(name, payload, coalesce) {
    return this.rpc.send(Constants.commands.eventCommand, {
        Name: name,
        Payload: payload,
        Coalesce: coalesce
    });
};

// Leave is used to trigger a graceful leave and shutdown of the agent
RPCClient.prototype.leave = function() {
    return this.rpc.send(Constants.commands.leaveCommand);
};

// UpdateTags will modify the tags on a running serf agent
RPCClient.prototype.updateTags = function(tags, delTags) {
    return this.rpc.send(Constants.commands.tagsCommand, {
        Tags: tags,
        DeleteTags: delTags
    });
};

// Respond allows a client to respond to a query event. The ID is the
// ID of the Query to respond to, and the given payload is the response.
RPCClient.prototype.respond = function(id, buf) {
    return this.rpc.send(Constants.commands.respondCommand, {
        ID: id,
        Payload: buf
    });
};

// InstallKey installs a new encryption key onto the keyring
RPCClient.prototype.installKey = function(key) {
    return this.rpc
        .send(Constants.commands.installKeyCommand, {
            Key: key
        })
        .then(function(data) {
            return data['Messages']
        });
};

// UseKey changes the primary encryption key on the keyring
RPCClient.prototype.useKey = function(key) {
    return this.rpc
        .send(Constants.commands.useKeyCommand, {
            Key: key
        })
        .then(function(data) {
            return data['Messages']
        });
};

// RemoveKey changes the primary encryption key on the keyring
RPCClient.prototype.removeKey = function(key) {
    return this.rpc
        .send(Constants.commands.removeKeyCommand, {
            Key: key
        })
        .then(function(data) {
            return data['Messages']
        });
};

// ListKeys returns all of the active keys on each member of the cluster
RPCClient.prototype.listKeys = function() {
    return this.rpc
        .send(Constants.commands.listKeysCommand)
        .then(function(data) {
            return {
                keys: data['Keys'],
                numNodes: data['NumNodes'],
                messages: data['Messages']
            }
        });
};

// Stats is used to get debugging state information
RPCClient.prototype.stats = function() {
    return this.rpc.send(Constants.commands.statsCommand);
};

// Monitor is used to subscribe to the logs of the agent
RPCClient.prototype.monitor = function(level) {
    return this.rpc
        .stream(Constants.commands.monitorCommand, {
            LogLevel: level
        })
        .progress(function(data) {
            return data['Log'];
        });
};

RPCClient.prototype.stream = function(type) {
    return this.rpc
        .stream(Constants.commands.streamCommand, {
            Type: type
        });
};

RPCClient.prototype.query = function(params) {
    var defer = Q.defer();

    var buffer = [];

    this.rpc
        .stream(Constants.commands.queryCommand, params)
        .progress(function(data) {
            switch (data['Type']) {
                case Constants.queryRecord.queryRecordAck:
                    return null;

                case Constants.queryRecord.queryRecordResponse:
                    data.Payload = new Buffer(data.Payload).toString('ascii');
                    buffer.push(data);
                    return defer.progress(data);

                case Constants.queryRecord.queryRecordDone:
                    return defer.resolve(buffer);

//                default:
//                    throw new Error("[ERR] Unrecognized query record type: " + data['Type']);
            }
        });

    return defer.promise;

};

// Stop is used to unsubscribe from logs or event streams
RPCClient.prototype.stop = function(handle) {
    this.rpc.stream.removeListener(handle);

    return this.rpc
        .send(Constants.commands.stopCommand, {
            Stop: handle
        });
};

module.exports = RPCClient;



