var Splurge = require('../../index.js');
var hub = new Splurge.Relay({ port: 5001 });
var tap = require('tap');
var test = tap.test;
var util = require('util');

var client = {
  connection: {},
   dnode: {},
   ip: '172.16.97.53',
   port: 55810,
   id: '2ce4ab47-3b70-6bf9-4c01-03548058a24b'
};

test('Test relay hub', function(t) {

  hub.start(function(err) {
    t.notOk(err, 'Should not return error on start');

    console.log('subscribe foo');

    hub.subscribe(client, 'foo');
    t.ok(hub.subscribers.foo, 'Event "foo" should be in the subscription list.');
    t.equal(hub.subscribers.foo.length, 1, 'Event "foo" should be length 1.');

    console.log('subscribe poo');

    hub.subscribe(client, 'poo');
    t.ok(hub.subscribers.poo, 'Event "poo" should be in the subscription list.');
    t.equal(hub.subscribers.poo.length, 1, 'Event "poo" should be length 1.');

    console.log('unsubscribe foo');

    hub.unsubscribe(client, 'foo');
    t.notOk(hub.subscribers.foo, 'Event "foo" should be removed.');
    t.equal(hub.subscribers.poo.length, 1, 'Event "poo" should remain in subscription list and be length 1.');

    console.log('unsubscribe all');

    hub.unsubscribe(client);
    t.notOk(hub.subscribers.foo, 'Event "foo" should be removed.');
    t.notOk(hub.subscribers.poo, 'Event "poo" should be removed.');

    hub.end(function() {
      t.notOk(err, 'Should not return error on end');
      t.end();
    });
  });

});