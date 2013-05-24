var Splurge = require('../index.js');
var client = new Splurge.Client({ 
    host: 'localhost', // 'fedev5.vast.com',
    port: 8989
  });

var total = 0;
var cnt = 0;

client.on('end', function() {
  console.log('Connection closed');
  process.exit();
});

client.on('random', function(payload) {
  var latency = (new Date()).valueOf() - payload.timestamp.created;
  total += latency;
  cnt++;
});

client.connect(function() {
  console.log('Connected.  Listening for "random" messages');
  client.subscribe('random');
});

setInterval(function() {
  var avg = cnt > 0 ? total/cnt : 0;
  console.log('Received: ' + cnt +'. Average latency: ' + avg);
  total = 0;
  cnt = 0;
}, 2000);