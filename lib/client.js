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

};

util.inherits(Client, events.EventEmitter);


Client.prototype.subscribe = function(event, callback) {
  if (!this._remote) {
    throw new Error('Connection not available.  Did you forget to call connect()?');
  }
  this._remote.subscribe(event, callback);
};

Client.prototype.publish = function(event, data, callback) {
  if (!this._remote) {
    throw new Error('Connection not available.  Did you forget to call connect()?');
  }
  this._remote.publish(event, callback);
};

Client.prototype.connect = function(callback) {
  this.on('ready', callback);

  this._connection = net.connect({
    port: this.port,
    host: this.host
  });

  this._connection.pipe(this._dnode).pipe(this._connection);
};

Client.prototype.close = function(callback) {
  this._remote = null;
  this._connection.close(callback);
};

module.exports = Client;