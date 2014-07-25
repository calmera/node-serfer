Serfer
=========

A library for NodeJS to allow you to communicate with a Serf (serfdom.io) agent.

## Installation

  npm install serfer --save

## Usage

  var serfer = require('serfer')();

  serfer
      .connect()
      .then(function() {
          log.log('info', 'up and running');
      });
  
  serfer
      .members()
      .then(function(data) {
          log.log('info', 'Members: ' + JSON.stringify(data));
      });

## Tests

  Test have not been written yet. This has more to do with figuring out how to actually 
  test this instead of me potentially disliking testing.

## Release History

* 0.1.0 Initial release