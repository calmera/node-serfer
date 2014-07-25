var Q = require('q'),
    net = require('net'),
    events = require('events'),
    Transcoder = require('./transcoder.js'),
    _ = require('underscore'),
    log = require('winston');

function SerfStream(config) {
    this.config = config;
    this.transcoder = new Transcoder();
}

SerfStream.prototype.emitter = new events.EventEmitter();

SerfStream.prototype.connect = function() {
    var defer = Q.defer();
    var self = this;

    this.client = net.connect(this.config.port, this.config.host, function() {
        self.client.on('data', function(data) {
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

                    if (result.data) {
                        log.log('info', '#' + result.header.Seq + ': Data response found : ' + JSON.stringify(result.data));
                    } else {
                        log.log('info', '#' + result.header.Seq + ': ACK response found');
                    }

                    self.emitter.emit(result.header.Seq, result);
                }
            } catch (error) {
                log.log('info', 'Unable to receive the message: ' + error);
                log.log('info', error.stack);
            }
        });
        defer.resolve();
    });

    self.client.on('error', function() {
        defer.reject(new Error('Unable to connect to the Serf Agent at ' + self.config.host + ':' + self.config.port));
    });

    return defer.promise;
};

SerfStream.prototype.send = function(header, body) {
    var defer = Q.defer();

    var self = this;
    var handler = function(response) {
//        log.log('info', 'handling the response for #' + response.header.Seq);

        if(_.has(response.header, "Error") && response.header.Error != "") {
            log.log('info', '#' + response.header.Seq + ': rejecting the response');
            return defer.reject(response.header.Error);
        }

        log.log('info', '#' + response.header.Seq + ': resolving the response');
        return defer.resolve(response.data);
    };

    // -- register a listener to handle the response
    self.emitter.on(header.Seq, handler);

    // -- send the header and body
    self.client.write(self.transcoder.encode(header));
    if (body) self.client.write(self.transcoder.encode(body));

    return defer.promise;
};

SerfStream.prototype.stream = function(header, body) {
    var defer = Q.defer();

    var self = this;
    var handler = function(response) {
        log.log('info', 'handling the response for #' + header.Seq);

        if(_.has(response, "Error") && response.Error != "") {
            log.log('info', 'rejecting the response since it contains an error');
            return defer.reject(response.Error);
        }

        log.log('info', 'streaming the response as a progression update');
        return defer.notify(response);
    };

    // -- register a listener to handle the response
    self.emitter.once(header.Seq, handler);

    // -- send the header and body
    self.client.write(self.transcoder.encode(header));
    if (body) self.client.write(self.transcoder.encode(body));

    return defer.promise.then(function(data) {
        log.log('info', 'promise resolved!');

        return data;
    });
};

module.exports = SerfStream;
