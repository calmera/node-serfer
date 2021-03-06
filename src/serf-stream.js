var Q = require('q'),
    net = require('net'),
    Transcoder = require('./transcoder.js'),
    _ = require('underscore'),
    log = require('winston');

var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    SerfStreamHandler = require('./handlers/serf-stream-handler');

function SerfStream(config) {
    this.config = config;
    this.transcoder = new Transcoder();
}

util.inherits(SerfStream, EventEmitter);

SerfStream.prototype.connect = function() {
    var defer = Q.defer();
    var self = this;

    this.client = net.connect(
        {
            port: this.config.port,
            host: this.config.host
        },
        function() { defer.resolve(); });

    this.client.on('data', function(data) {
        try {
            var decoded = self.transcoder.decode(data);

            var responses = decoded.values;
            for (var i = 0; i < responses.length; i++) {
                if (! _.has(responses[i], 'Seq')) {
                    log.log('info', 'Something went wrong while processing the responses! Got ' + JSON.stringify(responses[i]));
                    continue;
                }

                var result = {
                    header: responses[i],
                    data: null
                };

                // -- look ahead to get the response
                if (i < responses.length - 1 && ! _.has(responses[i + 1], 'Seq')) {
                    result.data = responses[i + 1];

                    // -- augment the counter to take the response value into account
                    i++;
                }

                self.emit(result.header.Seq, result);
            }
        } catch (error) {
            log.log('info', 'Unable to receive the message: ' + error);
            log.log('info', error.stack);
        }
    });
//    this.client.on('error', function(error) {
//        defer.reject(new Error('Unable to connect to the Serf Agent at ' + self.config.host + ':' + self.config.port));
//    });

    this.client.on('drain', function(error) { console.log('drain'); });
    this.client.on('timeout', function(error) { console.log('timeout'); });
    this.client.on('end', function(error) { console.log('end'); });
    this.client.on('close', function(error) { console.log('close'); });

    return defer.promise;
};

SerfStream.prototype.send = function(header, body) {
    var defer = Q.defer();

    var self = this;
    var handler = function(response) {
        if(_.has(response.header, "Error") && response.header.Error != "") {
            return defer.reject(response.header.Error);
        }
        return defer.resolve(response.data);
    };

    // -- register a listener to handle the response
    self.once(header.Seq, handler);

    // -- send the header and body
    self.client.write(self.transcoder.encode(header));
    if (body) self.client.write(self.transcoder.encode(body));

    return defer.promise;
};

SerfStream.prototype.stream = function(header, body) {
    var handler = new SerfStreamHandler(this, header.Seq);

    // -- send the header and body
    this.client.write(this.transcoder.encode(header));
    if (body) this.client.write(this.transcoder.encode(body));

    return handler;
};

module.exports = SerfStream;
