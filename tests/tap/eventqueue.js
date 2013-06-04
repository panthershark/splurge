var EventQueue = require('../../lib/eventqueue.js');
var tap = require('tap');
var test = tap.test;
var util = require('util');
var fs = require('fs');
var path = require('path');
var testPath =  path.resolve(process.cwd(), './db');
var _ = require('lodash');
var rimraf = require('rimraf');


// if (fs.existsSync(testPath)) {
//   console.log('removing old db path: ' + testPath);
//   rimraf.sync(testPath);
// }

test('Event Queue Initialization', function(t) {
  var q = new EventQueue({
    name: 'test-queue-init',
    basePath: testPath
  });

  t.ok(q, 'New event queue should exist');

  q.init(function(err) {
    t.notOk(err, 'Should not return error');
    t.ok(q.db, 'Should have an instance of db');
    t.ok(fs.existsSync(q.dbPath), 'dbPath should have been created.');
    t.end();
  });

});

test('Stream Write and Read sequentially from queue', function(t) {
  var q = new EventQueue({
    name: 'test-read-write',
    basePath: testPath
  });

  // generate a random set of values.
  var start = Math.random() * 100;
  var vals = _.range(start, start + 100, 2);
  var i = 0;
  var writtenCount = 0;

  q.on('drain', function() {

    console.log('drain');

    if (writtenCount === vals.length) {

    console.log('drain exec');

      q.getEventStream(function(err, rs) {

        rs.on('data', function(leveldbValue) {
          var item = vals[i];

          console.log(leveldbValue);
          t.equal(item.val, leveldbValue.val, 'Item[' + i + '] in read stream should match.');
          i++;
        });

        rs.on('close', function() {
          console.log('esdhjfjklhsd');
          t.end();
        });

      });

    }
  });

  q.init(function(err) {

    _.each(vals, function(v) {
      writtenCount++;
      q.push({ val: v });
    });

  });

});