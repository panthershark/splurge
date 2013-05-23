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
      subscribe: function(event, em, cb) {
        var err = null;

        try {
          var cl = _.clone(client);
          cl.emitter = em;
          that.subscribe(cl, event);
          that.emit('subscribe', { event: event, client: client, emitter: em });
        } catch (e) {
          err = e;
          that.emit('error', { operation: 'subscribe', err: err });
        }

        _.isFunction(cb) ? cb(err, this) : null;
      },
      unsubscribe: function(event, cb) {
        var err = null;

        try {
          that.unsubscribe(client, event);
        } catch (e) {
          err = e;
          that.emit('error', { operation: 'unsubscribe', err: err });
        }

        _.isFunction(cb) ? cb(err, this) : null;
      },
      ping: function(cb) {
        that.emit('ping', client);
        _.isFunction(cb) ? cb() : null;
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

    d.on('error', function(err) {
      that.emit('error', { operation: 'unknown', err: err, client: client });
    });

    d.on('fail', function(err) {
      that.emit('fail', { operation: 'unknown', err: err, client: client });
    });

    // remove all subscribers for this connection.
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

var unsubscribeEvent = function(client, ev) {
  var that = this;

  if (that.subscribers[ev] === null) {
    return;
  }

  that.subscribers[ev] = _.filter(that.subscribers[ev], function(sub) { 
    var kill = (client.id === sub.id); 

    if (kill) {
      that.emit('unsubscribe', { event: ev, client: client });
    }
    return !kill;
  });

  if (this.subscribers[ev].length === 0) {
    delete that.subscribers[ev];
  }

};

Relay.prototype.unsubscribe = function(client, event) {
  var that = this;
  if (event) {
    unsubscribeEvent.call(this, client, event);
  }
  else {
    _.each(that.subscribers, function(array, ev) {
      unsubscribeEvent.call(that, client, ev);
    });
  }
};

Relay.prototype.subscribe = function(client, event) {
  this.subscribers[event] = this.subscribers[event] || [];
  this.subscribers[event].push(client);
};

Relay.prototype.queue = function(event, data, callback) {
  var err = null,
      entry = {
        event: event,
        data: data
      };

  try {
    this.eventQueue.push(entry);
  } catch(e) {
    err = e;
  }

  if (err) {
    this.emit('error', { operation: 'queue', err: err });
  }
  else {
    this.emit('queue', entry);
    this.processQueue();
  }

  callback(err, entry);
};

Relay.prototype.processQueue = function() {
  var q = this.eventQueue,
      subscribers = this.subscribers,
      that = this;

  // clear queue
  this.eventQueue = [];

  _.each(q, function(entry) {
    var ev = entry.event,
        data = entry.data;

    _.each(subscribers[ev], function(sub) {

      try {
        sub.emitter(ev, data);
        that.emit('publish', { entry: entry, subscriber: sub });
      } catch (e) {
        that.emit('error', { operation: "processQueue", err: e, entry: entry, subscriber: sub });
      }

    });
  });

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