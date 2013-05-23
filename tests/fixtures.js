var Splurge = require('../index.js');

module.exports = function(port, callback) {
  var hub = new Splurge.Relay({ port: port || 5000 });
  hub.start(callback);
};