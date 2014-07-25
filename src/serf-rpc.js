var SerfStream = require('./serf-stream.js'),
    log = require('winston'),
    Constants = require('./constants.js'),
    Q = require('q');

function SerfRPC() {
    this.sequence = 0;
    this._stream = null;
}

SerfRPC.prototype.connect = function(config) {
    this._stream = new SerfStream(config);

    return this._stream.connect()
        .then(this.handshake())
        .then(this.auth(config.authKey));
};

SerfRPC.prototype.send = function(command, body) {
    var header = {
        "Command": command,
        "Seq": this.sequence++
    };

    log.log('info', '#' + header.Seq + ': sent ' + JSON.stringify(header));

    return this._stream
        .send(header, body)
        .then(function(data) {
            log.log('info', '#' + header.Seq + ': promise resolved in rpc: ' + JSON.stringify(data));
            return data;
        });
};

SerfRPC.prototype.stream = function(command, body) {
    var header = {
        "Command": command,
        "Seq": this.sequence++
    };

    return this._stream.stream(header, body);
};

SerfRPC.prototype.handshake = function() {
    return this.send(Constants.commands.handshakeCommand, {
        Version: Constants.versions.maxIPCVersion
    });
};

SerfRPC.prototype.auth = function(authKey) {
    if (! authKey) return null;

    return this.send(Constants.commands.authCommand, {
        AuthKey: authKey
    });
};

module.exports = SerfRPC;
