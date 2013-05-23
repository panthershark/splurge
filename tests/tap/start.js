var Splurge = require('../index.js');
var hub = new Splurge.Relay({ port: 5001 });
var tap = require('tap');
var test = tap.test;

test('Ensure Relay starts and ends', function(t) {

  hub.start(function(err) {
    t.notOk(err, 'Should not return error on start');
    hub.end(function() {
      t.notOk(err, 'Should not return error on end');
      t.end();
    });
  });

});