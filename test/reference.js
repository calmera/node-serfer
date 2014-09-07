var Serfer = require('../src'),
    log = require('winston'),
    spawn = require('child_process').spawn;


// -- start an agent locally
var masterAgent = spawn('serf', [
    'agent',
    '-node', 'masterAgent',
    '-rpc-addr', 'localhost:7350',
    '-bind', '0.0.0.0:7950'
]);

masterAgent.stdout.on('data', function (data) {
    console.log('[MASTER] stdout: ' + data);
});

masterAgent.stderr.on('data', function (data) {
    console.log('[MASTER] stderr: ' + data);
});

masterAgent.on('close', function (code) {
    console.log('[MASTER] exited with code ' + code);
});

setTimeout(function() {
    var masterClient = new Serfer();

    masterClient
        .connect({
            host: "localhost",
            port: 7350
        })
        .then(function() {
            masterClient
                .members()
                .then(function(data) {
                    log.log('info', 'Members: ' + JSON.stringify(data));
                });

            var handler = masterClient.stream('*');

            handler.on('data', function(data) {
                if (!data || !data.data || !data.data.Payload) return;
                log.log('info', '=> LOAD: ' + data.data.Payload);
            });
        });

}, 2000);