var fixture = require('../fixtures.js');
var Splurge = require('../../index.js');
var tap = require('tap');
var test = tap.test;

fixture(function(err, hub) {

  if (err) {
    throw err;
  }

  test('Client connect', function(t) {
    var client = new Splurge.Client({ port: hub.port });

    client.connect(function(err) {

      t.notOk(err, 'Should not return error');
      t.ok(client._remote, 'Remote functions should exist');
      t.ok(client._remote.publish, 'Publish should exist');
      t.type(client._remote.publish, 'function', 'Publish should be function');
      t.ok(client._remote.subscribe, 'Subscribe should exist');
      t.type(client._remote.subscribe, 'function', 'Subscribe should be function');
      t.end();
    });
  });

});

