var Splurge = require('../index.js');
var client = new Splurge.Client({ 
    host: 'localhost', // 'fedev5.vast.com',
    port: 8989
  });

var interval = 10;

client.on('end', function() {
  console.log('Connection closed');
  process.exit();
});

client.connect(function() {
  console.log('Connected.  Sending ' + (1000/interval) + ' messages per second.');

  setInterval(function() {
    var n = Math.random() * 100000;
    client.publish('random', n, function(err) {
      if (!err) {
        console.log('Published "random" event with value: ' + n);
      }
    });
  }, interval);

});