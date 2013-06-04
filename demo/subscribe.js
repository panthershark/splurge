var Splurge = require('../index.js');
var client = new Splurge.Client({ 
    host: 'localhost', // 'fedev5.vast.com',
    port: 8989
  });

var total = 0;
var cnt = 0;
var latency = 0;

client.on('end', function() {
  console.log('Connection closed');
  process.exit();
});

client.on('random', function(payload) {
  var now = (new Date()).valueOf();
  latency += now - payload.timestamp.emitted;
  total += now - payload.timestamp.created;
  cnt++;
});

client.connect(function() {
  console.log('Connected.  Listening for "random" messages');
  client.subscribe('random');
});

setInterval(function() {
  var trip = cnt > 0 ? total/cnt : 0;
  var lat = cnt > 0 ? latency/cnt : 0;
  console.log('Received: ' + cnt +'. Average network latency: ' + lat + 'ms. Average trip: ' + trip + 'ms.');
  total = 0;
  latency = 0;
  cnt = 0;
}, 1000);