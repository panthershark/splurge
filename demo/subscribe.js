var Splurge = require('../index.js');
var client = new Splurge.Client({ 
    host: 'fedev5.vast.com',
    port: 8989
  });

var interval = 300;

client.connect(function() {
  console.log('Connected.  Listening for random messages');

  client.subscribe('random');
  client.on('random', function(payload) {
    console.log('Received message: ' + JSON.stringify(payload));
  });


});