var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    _ = require('underscore');

function SerfStreamHandler(stream, sequence) {
    this.stream = stream;
    this.sequence = sequence;
    this.handler = function(response) {
        if(_.has(response, "Error") && response.Error != "") {
            return self.emit('error', response.Error);
        }

        return self.emit('data', response);
    };

    var self = this;
    this.stream.on(this.sequence, this.handler);
}

util.inherits(SerfStreamHandler, EventEmitter);

SerfStreamHandler.prototype.stop = function() {
    this.removeAllListeners('error');
    this.removeAllListeners('data');

    this.stream.removeListener(this.sequence, this.handler);
};
module.exports = SerfStreamHandler;