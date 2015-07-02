var express    = require('express');
var http       = require('http');
var bodyParser = require("body-parser");

// Save the subscriptions since heroku kills free dynos like the ice age.
var dirty = require('dirty');
var db = dirty('subscriptions.db');

var activeSubscriptionIds = [];
var previousRequestTime = 0;

/**
 * Setup
 */

// S-s-s-server.
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.set('port', process.env.PORT || 3000);

http.createServer(app).listen(app.get('port'), function() {
  console.log('Started server on port ' + app.get('port'));
});

// Restore subscriptions.
db.on('load', function() {
  db.forEach(function(key, val) {
    if (val)
      activeSubscriptionIds.push(key);
  });
  console.log("Subscriptions loaded from database: " + activeSubscriptionIds.length);
});

/**
 * This is what <platinum-push-messaging> uses as the notification content,
 * so we should intercept it and do something better with it. Like get it from
 * a giant cat server.
 */
app.get('/notification-data.json', function (req, res) {
  // Testing data
  var titles = ["I am a server cat",
                "Halp I am a cat trapped in a push notification",
                "Meow"];
  var messages = ["I live in a server",
                  "Hello? Is anyody there? Hello?",
                  "Thank you for subscribing to cat facts"];
  var icons = ["https://i.imgur.com/fRIM0VX.png",
               "https://i.imgur.com/jtKsmWk.gif",
               "https://i.imgur.com/PZr3RGC.jpg"];

  var index = Math.floor(Math.random() * 3);

  res.json({
    'title': titles[index],
    'message': messages[index],
    'url': icons[index],
    'icon': icons[index],
    'tag': 'cat-push-notification'
  });
});

/**
 * I don't know how to load heroku config values into a json file.
 */
var manifest = require('./manifest.json');
manifest.gcm_sender_id = process.env.GCM_SENDER;

app.get('/manifest.json', function (req, res) {
  res.json(manifest);
});

/**
 * Add or remove a subscription.
 */
app.post('/subscription_change', function (req, res) {
  var enabled = req.body.enabled;
  var id = req.body.id;
  var index = activeSubscriptionIds.indexOf(id);

  if (enabled == 'true') {
    if (index == -1) {
      db.set(id, true);
      activeSubscriptionIds.push(id);
    }
  } else {
    var index = activeSubscriptionIds.indexOf(id);
    activeSubscriptionIds.splice(index,1);
    db.rm(id);
  }
  res.end();
});

/**
 * Returns the number of known subscriptions (some could be inactive).
 */
app.get('/get_subscription_count', function (req, res) {
  res.json({'subscriptions': activeSubscriptionIds.length});
});

/**
 * Send ヽ(^‥^=ゞ) to everyone!! But only once a minute because lol spam.
 */
app.get('/push_cats', function (req, res) {
  var elapsed = new Date() - previousRequestTime;

  if ((elapsed / 1000) < 60) {
    res.end('Request throttled');
    return;
  }

  var data = {
    "delayWhileIdle":true,
    "timeToLive":3,
    "data":{
      'title': 'this is an important cat notification',
      'message': 'click on it. click on the cat.'
    },
    "registration_ids":activeSubscriptionIds
  };

  var dataString =  JSON.stringify(data);
  var headers = {
    'Authorization' : 'key=' + process.env.API_KEY,
    'Content-Type' : 'application/json'
  };

  var options = {
    host: 'android.googleapis.com',
    port: 80,
    path: '/gcm/send',
    method: 'POST',
    headers: headers
  };

  var req = http.request(options, function(res) {
    res.setEncoding('utf-8');
    var responseString = '';

    res.on('data', function(data) {
      responseString += data;
    });
    res.on('end', function() {
      console.log(responseString);
    });
    console.log('STATUS: ' + res.statusCode);
  });
  req.on('error', function(e) {
    console.log('error : ' + e.message + e.code);
  });

  req.write(dataString);
  req.end();
  previousRequestTime = new Date();
});

/**
 * Try to close the database.  ¯\_(ツ)_/¯
 */
var gracefulShutdown = function() {
  console.log("Received kill signal, shutting down gracefully.");
  db.close();
  server.close(function() {
    console.log("Closed out remaining connections.");
    process.exit()
  });
}

// listen for TERM signal .e.g. kill
process.on ('SIGTERM', gracefulShutdown);
// listen for INT signal e.g. Ctrl-C
process.on ('SIGINT', gracefulShutdown);
