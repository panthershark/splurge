var _ = require('lodash');
var dnode = require('dnode');
var net = require('net');
var util = require('util');
var events = require("events");
var guid = require('guid');
var EventQueue = require('./eventqueue.js');

// Pubsub relay server.
var Relay = function(options) {
  this.id = guid.create().toString();

  _.defaults(options || {}, {
    port: 5004, 
    name: 'relay'
  });

  this.port = options.port;
  this.name = options.name;

  // TODO: move this subscriber data to pluggable tracking mechanism
  this.subscribers = {};

  // LevelDB queuing mechanism
  this.eventQueue = new EventQueue({ 
    name: [options.name.replace(/[^\w]/g, '-'), this.id].join('-')
  });

  this.eventQueue.init(function(err) {
    if (err) {
      console.log('Event Queue failed to initialize.');
      process.exit();
    }
  });

  var that = this;
  this.server = net.createServer(function (c) {

    var d = dnode({
      publish : function (event, data, timestamp, cb) {
        // push event to queue
        that.queue({
          event: event,
          data: data,
          source: source,
          timestamp: {
            created: timestamp,
            processed: (new Date()).valueOf(),
            emitted: null
          }
        }, cb);
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
    }, 
    source = _.pick(client, 'id', 'ip')

    that.emit('connect', client);

    d.on('error', function(err) {
      that.emit('error', { operation: 'unknown', err: err, client: client });
      c.unpipe().end();
    });

    d.on('end', function(err) {
      that.emit('error', { operation: 'unknown', err: err, client: client });
      c.unpipe().end();
    });

    d.on('fail', function(err) {
      that.emit('fail', { operation: 'unknown', err: err, client: client });
      c.unpipe().end();
    });

    c.on('error', function(err) {
      try {
        that.unsubscribe(client);
      } catch (e) {
        that.emit('error', { operation: 'unsubscribe', err: e, client: client });
      }
      that.emit('disconnect', client);

      c.unpipe();
      d.end();
    });

    // remove all subscribers for this connection.
    c.on('end', function() {
      try {
        that.unsubscribe(client);
      } catch (e) {
        that.emit('error', { operation: 'unsubscribe', err: e, client: client });
      }
      that.emit('disconnect', client);

      c.unpipe();
      d.end();
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

Relay.prototype.queue = function(entry, callback) {
  var err = null;

  try {
    this.eventQueue.push(entry);
    this.emit('queue', { entry: entry, queueLength: this.queue.length });
  } catch(e) {
    err = e;
    this.emit('error', { operation: 'queue', err: err });
  }

  _.isFunction(callback) ? callback(err, this) : null;
};

Relay.prototype.processQueue = function() {
  var subscribers = this.subscribers;
  var that = this;

  console.log('processing queue');

  this.eventQueue.getEventStream(function(err, queueStream) {
    console.log('queueStream');

    queueStream.on('data', function(item) {
      var entry = JSON.parse(item);
      var ev = entry.event;

      if (subscribers[ev]) {
        var message = _.clone(entry);
        message.source = _.pick(message.source, 'id', 'ip');
        message.timestamp.emitted = (new Date()).valueOf();

        _.each(subscribers[ev], function(sub) {

          try {
            sub.emitter(ev, message);
            that.emit('publish', { message: message, subscriber: sub });
          } catch (e) {
            that.emit('error', { operation: "processQueue", err: e, entry: entry, subscriber: sub });
          }

        });
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