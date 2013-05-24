var _ = require('lodash');
var dnode = require('dnode');
var net = require('net');
var util = require('util');
var events = require("events");

var Client = function(options) {
  _.defaults(options || {}, {
    host: 'localhost',
    port: 5004
  });

  this.port = options.port;
  this.host = options.host;

  this._dnode = dnode();
  this._remote = null;

  var that = this;
  this._dnode.on('remote', function (remote) {
    that._remote = remote;
    that.emit('ready');
  });

  this.emitter = new events.EventEmitter();
};

util.inherits(Client, events.EventEmitter);


Client.prototype.subscribe = function(event, callback) {
  if (!this._remote) {
    throw new Error('Connection not available.  Did you forget to call connect()?');
  }

  var that = this;
  this.emitter.removeAllListeners(event);
  this.emitter.on(event, function(payload) {
    that.emit(event, payload);
  });

  var emit = this.emitter.emit.bind(this.emitter);
  this._remote.subscribe(event, emit, callback);
};

Client.prototype.unsubscribe = function(event, callback) {
  if (!this._remote) {
    throw new Error('Connection not available.  Did you forget to call connect()?');
  }
  this.emitter.removeAllListeners(event);
  this._remote.unsubscribe(event, callback);
};

Client.prototype.publish = function(event, data, callback) {
  if (!this._remote) {
    throw new Error('Connection not available.  Did you forget to call connect()?');
  }
  this._remote.publish(event, data, (new Date()).valueOf(), callback);
};

Client.prototype.ping = function(callback) {
  if (!this._remote) {
    throw new Error('Connection not available.  Did you forget to call connect()?');
  }
  this._remote.ping(callback);
};

Client.prototype.connect = function(callback) {
  var that = this;

  this.on('ready', callback);

  this._connection = net.connect({
    port: this.port,
    host: this.host
  });

  this._connection.on('end', function(){
    that.emit('end');
  });

  this._connection.pipe(this._dnode).pipe(this._connection);
};

Client.prototype.end = function(callback) {
  this._remote = null;
  this._connection.end(callback);
};

module.exports = Client;