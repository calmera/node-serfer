var Serfer = require('../src'),
    log = require('winston'),
    spawn = require('child_process').spawn,
    os = require('os');

var sequence = Number(process.argv[2]);

// -- start an agent locally
var nodeAgent = spawn('serf', [
    'agent',
    '-node', 'node-' + sequence,
    '-rpc-addr', 'localhost:' + (7373 + sequence),
    '-bind', '0.0.0.0:' + (7946 + sequence)
]);

nodeAgent.stdout.on('data', function (data) {
    console.log('[NODE-' + sequence + '] stdout: ' + data);
});

nodeAgent.stderr.on('data', function (data) {
    console.log('[NODE-' + sequence + '] stderr: ' + data);
});

nodeAgent.on('close', function (code) {
    console.log('[NODE-' + sequence + '] exited with code ' + code);
});

var nodeClient = new Serfer({
    host: "localhost",
    port: (7373 + sequence)
});

nodeClient
    .connect()
    .then(function() {
        log.log('info', 'up and running');
    });

setTimeout(function() {
    nodeClient
        .join(['127.0.0.1:7946'], false)
        .then(function() {
            log.log('info', 'Joined the cluster!');
        });

    setInterval(function() {
        var data = os.loadavg();
        log.log('info', 'sending ' + JSON.stringify(data));
        nodeClient.userEvent('load', JSON.stringify(data), false);
    }, 5000);

}, 2000);


