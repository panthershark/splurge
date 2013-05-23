var Splurge = require('../index.js');

module.exports = function(callback) {
  var client = new Splurge.Client({ 
    host: 'localhost', //'fedev5.vast.com',
    port: 8989
  });

  client.connect(callback);
  return client;
};