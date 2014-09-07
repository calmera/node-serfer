var _ = require("lodash"),
    msgpack = require("msgpack-js-v5-ng");

function Transcoder() {}

Transcoder.prototype.decode = function(data){
    var values = [];
    var cache = new Buffer(0);
    var head, trailing, value, decoded;

    while (data.length > 0) {
        head = data.slice(0, 1);
        data = data.slice(1, data.length);
        cache = Buffer.concat([cache, head]);

        try {
            try {
                decoded = msgpack.decode(cache);
            } catch (error) {
                if (error.name == 'RangeError') continue;
            }
            if (! decoded) continue;

            if (decoded.trailing == 0) {
                values.push(decoded.value);
                cache = new Buffer(0);
            }
        } catch(err) {
            console.log('Error decoding msgPack object: ', err.message);
            console.log(err.stack);
        }
    }

    return {
        seq: (values.length == 1) ? decoded.value.Seq : _.first(values).Seq,
        values: values
    };
};

Transcoder.prototype.encode = function(data){
    return msgpack.encode(data);
};

module.exports = Transcoder;