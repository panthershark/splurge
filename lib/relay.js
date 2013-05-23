var _ = require('lodash');
var dnode = require('dnode');
var net = require('net');
var util = require('util');
var events = require("events");
var guid = require('guid');

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

  var that = this;
  this.server = net.createServer(function (c) {

    var d = dnode({
      publish : function (event, data, cb) {
        // push event to queue
        that.queue(event, data, cb);
      },
      subscribe: function(event, cb) {
        var err = null;

        try {
          that.subscribers[event] = that.subscribers[event] || [];
          that.subscribers[event].push(client);
        } catch (e) {
          err = e;
          that.emit('error', { operation: 'subscribe', err: err });
        }

        if (!err) {
          that.emit('subscribe', { event: event, client: client });
        }

        cb(err);
      },
      ping: function(cb) {
        cb();
      }
    });

    var client = { 
      connection: c, 
      dnode: d, 
      ip: _.clone(c.remoteAddress), 
      port: _.clone(c.remotePort), 
      id: guid.create().toString() 
    };

    that.emit('connect', client);

    // remove all subscribers for this connection.
    d.on('error', function(err) {
      that.emit('error', { operation: 'unknown', err: err, client: client });
    });

    d.on('fail', function(err) {
      that.emit('fail', { operation: 'unknown', err: err, client: client });
    });

    c.on('end', function() {
      try {
        that.unsubscribe(client);
      } catch (e) {
        that.emit('error', { operation: 'unsubscribe', err: e, client: client });
      }

      that.emit('disconnect', client);
    });

    c.pipe(d).pipe(c);
  });

};

util.inherits(Relay, events.EventEmitter);

Relay.prototype.unsubscribe = function(client) {
  var that = this;

  _.each(that.subscribers, function(array, event) {

    that.subscribers[event] = _.filter(that.subscribers[event], function(sub) { 
      var kill = client.id === sub.id; 

      if (kill) {
        that.emit('unsubscribe', { event: event, client: client });
      }
      return kill;
    });
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

  if (err) {
    this.emit('error', { operation: 'queue', err: err });
  }
  else {
    this.emit('queue', { entry: entry });
  }

  callback(err, entry);
};

Relay.prototype.start = function(callback) {
  var that = this;
  this.server.listen(this.port, function(err) {
    _.isFunction(callback) ? callback(err, this) : null;
    that.emit('start', this.server);
  });
};

Relay.prototype.end = function(callback) {
  var that = this;
  this.server.close(function(err) {
    _.isFunction(callback) ? callback(err, this) : null;
    that.emit('end', this.server);
  });
};

module.exports = Relay;