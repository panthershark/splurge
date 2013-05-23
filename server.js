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
  console.log(subscription.connection.remoteAddress + ' is listening for "' + subscription.event + '" events.');
});

hub.on('unsubscribe', function(subscription) {
  console.log(subscription.connection.remoteAddress + ' is listening for "' + subscription.event + '" events.');
});

hub.on('connect', function(client) {
  console.log(client.connection.remoteAddress + ' has connected.');
});

hub.on('disconnect', function(client) {
  console.log(client.connection.remoteAddress + ' has disconnected.');
});

hub.start(function(err) {
  if (err) {
    console.log("Error starting server");
    console.log(util.inspect(err));
    process.exit();
  }

  console.log("Server started on port " + hub.port);

});