var _ = require('lodash');
var dnode = require('dnode');
var net = require('net');

// Pubsub relay server.
var Relay = function(options) {
  _.defaults(options || {}, {
    port: 5004
  });

  this.port = options.port;

  // TODO: move this subscriber data to pluggable tracking mechanism
  this.subscribers = {};

  // TODO: replace this will a pluggable queuing mechanism.
  this.eventQueue = [];

  this.server = net.createServer(function (c) {
    var d = dnode({
      publish : function (event, data, cb) {
        // push event to queue
        this.queue(event, data, cb);
      },
      subscribe: function(event, cb) {
        var err = null;

        try {
          this.subscribers[event] = this.subscribers[event] || [];
          this.subscribers[event].push({ connection: c });
        } catch (e) {
          err = e;
        }

        cb(err);
      },
      ping: function(cb) {
        cb();
      }
    });

    c.pipe(d).pipe(c);
  });

};

Relay.prototype.queue = function(event, data, callback) {
  var err = null,
      entry = {
        event: event,
        data: data
      };

  try {
    this.eventQueue.add(entry);
  } catch(e) {
    err = e;
  }

  callback(err, entry);
};

Relay.prototype.start = function(callback) {
  this.server.listen(this.port, function(err) {
    _.isFunction(callback) ? callback(err, this) : null;
  });
};

Relay.prototype.end = function(callback) {
  this.server.close(callback);
};

module.exports = Relay;