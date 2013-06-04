var Splurge = require('./index.js');
var cluster = require('cluster');
var util = require('util');
var hub = new Splurge.Relay({ port: 8989 });
var _ = require('lodash');

require("http").globalAgent.maxSockets = 500;

var logger = {
  error: function(s) { console.log(s); },
  info: function(s) { console.log(s); }
};

var createServer = function() {
  hub.on('error', function(data) {
    console.log(util.inspect(data.err));
  });

  hub.on('queue', function(data) {
    var entry = data.entry;
    console.log('"' + entry.event + '" event was queued with the following data ' + util.inspect(entry.data));
    
    hub.processQueue();     
  });

  // hub.on('publish', function(data) {
  //   var elapsed = data.message.timestamp.created - data.message.timestamp.emitted;
  //   console.log('"' + data.message.event + '" with data(' + data.message.data +') was relayed in ' + elapsed + 'ms');
  // });

  hub.on('subscribe', function(subscription) {
    var client = subscription.client;
    console.log(client.ip + ':' + client.port + ' (' + client.id + ') is listening for "' + subscription.event + '" events.');
  });

  hub.on('unsubscribe', function(subscription) {
    var client = subscription.client;
    console.log(client.ip + ':' + client.port + ' (' + client.id + ') is no longer listening for "' + subscription.event + '" events.');
  });

  hub.on('connect', function(client) {
    console.log(client.ip + ':' + client.port + ' (' + client.id + ') has connected.');
  });

  hub.on('disconnect', function(client) {
    console.log(client.ip + ':' + client.port + ' (' + client.id + ') has disconnected.');
  });

  hub.on('ping', function(client) {
    console.log('Ping from ' + client.ip + ':' + client.port + ' (' + client.id + ').');
  });

  hub.start(function(err) {
    if (err) {
      console.log("Error starting server");
      console.log(util.inspect(err));
      process.exit();
    }

    console.log("Server started on port " + hub.port);

    // setInterval(function() {
    //   console.log(util.inspect(hub.subscribers));
    // }, 1000);

  });
};

// Start cluster.
var children = {};
var clusterConfig = {
    on: false,
    workers: 4
  };

if(clusterConfig.on){
  logger.info("Using cluster");
  
  var numCPUs = clusterConfig.workers || require('os').cpus().length;
  
  if(cluster.isMaster){
    logger.info("Starting master with " + numCPUs + " CPUs");

    // spawn n workers
    for (var i = 0; i < numCPUs; i++) {
      var child = cluster.fork();
      children[child.process.pid] = child;
    }

    // Add application kill signals.
    var signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    _.each(signals, function(sig) {

      process.on(sig, function() {

        _.each(children, function(child) {
          child.destroy();  // send suicide signal
        });

        // create function to check that all workers are dead.
        var checkExit = function() {
          if (_.keys(children).length == 0) {
            process.exit();
          }
          else {
            setImmediate(checkExit);   // keep polling for safe shutdown.
          }
        };

        // poll the master and exit when children are all gone.
        setImmediate(checkExit);
        
      });

    });

    cluster.on('exit', function(worker) {
      logger.error('Worker exited unexpectedly. Spawning new worker', worker);

      // remove the child from the tracked running list..
      delete children[worker.process.pid];

      // if it purposely destroyed itself, then do no re-spawn.  
      // Otherwise, it was killed for some external reason and should create a new child in the pool.
      if (!worker.suicide) {

        // spawn new child
        var child = cluster.fork();
        children[child.process.pid] = child;
      }
       
    });

  } else {
    logger.info("Worker ID", process.env.NODE_WORKER_ID);
    createServer();
  }
  
} 
else {
  createServer();
}