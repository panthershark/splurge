var _ = require('lodash');
var util = require('util');
var levelup = require('level');
var fs = require('fs');
var path = require('path');
var events = require('events');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

var EventQueue = function(options) {
  this.options = _.defaults(options || {}, {
    name: '',
    basePath: path.resolve(process.cwd(), './db')
  });

  this.key = 0;
  this.options.name = options.name.replace(/[^\w]/g, '-') + '.leveldb';
};

util.inherits(EventQueue, events.EventEmitter);

EventQueue.prototype.init = function(callback) {
  this.dbPath = path.resolve(this.options.basePath, this.options.name);

  if (fs.existsSync(this.dbPath)) {
    rimraf.sync(this.dbPath);
  }

  var that = this;
  mkdirp(this.dbPath, function (err) {
    if (err) {
      callback(err);
      return;
    }

    that.db = levelup(that.dbPath, that.options.dbOptions, callback);

  });
  
};

EventQueue.prototype.closeWriteStream = function(callback) {
  var oldWriteStream = this.writeStream;
    this.writeStream = null;

    oldWriteStream.end();

    oldWriteStream.on('close', function() {
      callback();
    });
};

EventQueue.prototype.createWriteStream = function() {
  if (this.writeStream) {
    return this.writeStream;
  }

  var that = this;
  
  this.writeStream = this.db.createWriteStream({
    keyEncoding: 'utf8',
    valueEncoding: 'json'
  });

  this.writeStream.on('error', function (err) {
    this.emit('error', { type: 'write', err: err, stream : this.writeStream });
  });

  this.writeStream.on('drain', function() {
    this.emit('drain', { stream : this.writeStream });
  });

};

EventQueue.prototype.push = function(val) {
  this.createWriteStream();

  var writeCompleted = this.writeStream.write({ key: this.key++, value: val });

  if (writeCompleted) {
    this.emit('drain', { stream : this.writeStream });
  }
};

EventQueue.prototype.getEventStream = function(callback) {
  var db = this.db;

  if (this.writeStream) {
    this.closeWriteStream(function() {
      callback(null, db.createValueStream());
    });
  }
  else {
    callback(null, db.createValueStream());
  }

};

module.exports = EventQueue;