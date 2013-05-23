var Splurge = require('../index.js');
var client = new Splurge.Client({ 
    host: 'localhost', // 'fedev5.vast.com',
    port: 8989
  });

var interval = 300;

client.connect(function() {
  console.log('Connected.  Sending random messages every ' + interval + 'ms');

  setInterval(function() {
    var n = Math.random() * 100000;
    client.publish('random', n, function(err) {
      if (!err) {
        console.log('Published "random" event with value: ' + n);
      }
    });
  }, interval);

});