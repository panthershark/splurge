var Splurge = require('../../index.js');
var tap = require('tap');
var test = tap.test;

var newClient = function(callback) {
  var client = new Splurge.Client({ 
    host: 'fedev5.vast.com',
    port: 8989
  });

  client.connect(callback);
  return client;
}

test('Client connect ', function(t) {
  var client = newClient(function(err) {

    t.notOk(err, 'Should not return error');
    t.ok(client._remote, 'Remote functions should exist');
    t.ok(client._remote.publish, 'Publish should exist');
    t.type(client._remote.publish, 'function', 'Publish should be function');
    t.ok(client._remote.subscribe, 'Subscribe should exist');
    t.type(client._remote.subscribe, 'function', 'Subscribe should be function');

    client.ping(function(err) {
      t.notOk(err, 'Ping succeeded');
      t.end();
    });

  });
});


// test('Client connect', function(t) {
//   var client = newClient(function(err) {

//     t.notOk(err, 'Should not return error');
//     t.ok(client._remote, 'Remote functions should exist');
//     t.ok(client._remote.publish, 'Publish should exist');
//     t.type(client._remote.publish, 'function', 'Publish should be function');
//     t.ok(client._remote.subscribe, 'Subscribe should exist');
//     t.type(client._remote.subscribe, 'function', 'Subscribe should be function');

//     client.subscribe('foo', function(subErr) {
//       t.notOk(subErr, 'Should not return error on subscribe');
//       t.end();
//     });

//   });
// });



