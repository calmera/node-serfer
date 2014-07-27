var Serfer = require('../src'),
    log = require('winston'),
    spawn = require('child_process').spawn;


// -- start an agent locally
var masterAgent = spawn('serf', [
    'agent',
    '-node', 'masterAgent'
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

var masterClient = new Serfer({
    host: "localhost",
    port: 7373
});

masterClient
    .connect()
    .then(function() {
        log.log('info', 'up and running');
    });

masterClient
    .members()
    .then(function(data) {
        log.log('info', 'Members: ' + JSON.stringify(data));
    });

masterClient
    .stream('*')
    .progress(function(data) {
        if (!data || !data.data || !data.data.Payload) return;
        log.log('info', '=> LOAD: ' + data.data.Payload);
    });