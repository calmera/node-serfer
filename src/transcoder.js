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

        try { decoded = msgpack.decode(cache); } catch(err) {}

        if (decoded.trailing == 0) {
            values.push(decoded.value);
            cache = new Buffer(0);
        }
    }

    return {
        seq: (values.length == 1) ? decoded.value.Seq : _.first(values).Seq,
        values: values
    }
};

Transcoder.prototype.encode = function(data){
    return msgpack.encode(data);
};

module.exports = Transcoder;