var RpcClient = require('index.js'),
    log = require('winston'),
    Q = require('q');

var client = new RpcClient();

client
    .connect()
    .then(function() {
        log.log('info', 'up and running');
    });

client
    .members()
    .then(function(data) {
        log.log('info', 'Members: ' + JSON.stringify(data));
    });

//client
//    .monitor("DEBUG")
//    .progress(function(data) {
//        log.log('info', '[MON] ' + JSON.stringify(data));
//    });

client
    .join(['127.0.0.1:7947'], true)
    .then(function(data) {
        log.log('info', 'Joined the cluster!');
    });

client
    .members()
    .then(function(data) {
        log.log('info', 'Members: ' + JSON.stringify(data));
    });