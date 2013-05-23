var Splurge = require('./index.js');
var util = require('util');
var hub = new Splurge.Relay({ port: 8989 });

hub.on('error', function(data) {
  console.log(util.inspect(data.err));
});

hub.on('queue', function(entry) {
  console.log('"' + entry.event + '" event was queued with the following data' + util.inspect(entry.data));
});

hub.on('subscribe', function(subscription) {
  var client = subscription.client;
  console.log(client.ip + ':' + client.port + ' (' + client.id + ') is listening for "' + subscription.event + '" events.');
});

hub.on('unsubscribe', function(subscription) {
  var client = subscription.client;
  console.log(client.ip + ':' + client.port + ' (' + client.id + ') is no longer listening for "' + subscription.event + '" events.');
});

hub.on('connect', function(client) {
  console.log(client.ip + ':' + client.port + ' (' + client.id + ') has connected.');
});

hub.on('disconnect', function(client) {
  console.log(client.ip + ':' + client.port + ' (' + client.id + ') has disconnected.');
});

hub.on('ping', function(client) {
  console.log('Ping from ' + client.ip + ':' + client.port + ' (' + client.id + ').');
});

hub.start(function(err) {
  if (err) {
    console.log("Error starting server");
    console.log(util.inspect(err));
    process.exit();
  }

  console.log("Server started on port " + hub.port);

  setInterval(function() {
    console.log(JSON.stringify(hub.subscribers));
  }, 1000);

});