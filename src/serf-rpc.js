var SerfStream = require('./serf-stream.js'),
    Constants = require('./constants.js');

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

    return this._stream
        .send(header, body)
        .then(function(data) {
            return data;
        });
};

SerfRPC.prototype.stream = function(command, body) {
    var header = {
        "Command": command,
        "Seq": this.sequence++
    };

    return this._stream
        .stream(header, body);
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
