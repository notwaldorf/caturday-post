var express    = require('express');
var http       = require('http');
var bodyParser = require("body-parser");
var Promise    = require('es6-promise').Promise;
var request    = require("request");

// Save the subscriptions since heroku kills free dynos like the ice age.
var mongodb = require('mongodb');

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

var server = http.createServer(app).listen(app.get('port'), function() {
  console.log('Started server on port ' + app.get('port'));
});

// Restore subscriptions.
var databasePromise = new Promise(function(resolve, reject) {
  mongodb.MongoClient.connect(process.env.MONGOLAB_URI, function(err, db) {
    if (err) {
      return reject(err);
    }
    resolve(db);
  });
});

databasePromise.then(function(db) {
  db.collection('subscriptions').find({}).toArray(function(err, result) {
    activeSubscriptionIds = result.map(function(subscription) {
      return subscription.id;
    });
    console.log("Subscriptions loaded from database: " + activeSubscriptionIds.length);
  });
}).catch(function(err) {
  console.log('DATABASE ERROR:', err, err.stack);
});

/**
 * This is what <platinum-push-messaging> uses as the notification content,
 * so we should intercept it and do something better with it. Like get it from
 * a giant cat server.
 */
app.get('/notification-data.json', function (req, res) {
  // Testing data
  var titles = ['Halp I am a cat trapped in a push notification',
                'And now, a haiku:'];

  // From http://www.adoptacatfoundation.org/cat_haikus.htm.
  // If you want to contribute with a haiku, please send a PR! :)
  var haikus = [
      'Is anybody there?\n\nHello?',
      'The food in my bowl\nIs old, and more to the point\nContains no tuna.',
      'So you want to play.\nWill I claw at dancing string?\nYour ankle\'s closer.',
      'There\'s no dignity\nIn being sick: which is why\nI don\'t tell you where.',
      'Seeking solitude\nI am locked in the closet.\nFor once I need you.',
      'Tiny can, dumped in plastic bowl\nPresentation, One star;\nService: none.',
      'Am I in your way?\nYou seem to have it backwards:\nThis pillow\'s taken.',
      'Your mouth is moving;\nUp and down, emitting noise.\nI\'ve lost interest.',
      'The dog wags his tail,\nSeeking approval. See mine?\nDifferent message.',
      'My brain: walnut-sized.\nYours: largest among primates.\nYet, who leaves for work?',
      'Most problems can be\nIgnored. The more difficult\nOnes can be slept through.',
      'My affection is conditional.\nDon\'t stand up,\nIt\'s your lap I love.',
      'Cats can\'t steal the breath\nOf children. But if my tail\'s\nPulled again, I\'ll learn.',
      'I don\'t mind being\nTeased, any more than you mind\nA skin graft or two.',
      'So you call this thing\nYour cat carrier. I call\nThese my blades of death.',
      'Toy mice, dancing yarn\nMeowing sounds.\nI\'m convinced: You\'re an idiot.'
    ];

  request("http://cats.nanobit.org/url", function(error, response, body) {
    var index = Math.floor(Math.random() * haikus.length);

    res.json({
      'title': index == 0 ? titles[0] : titles[1],
      'message': haikus[index],
      'url': body,
      'icon': body,
      'tag': 'cat-push-notification'
    });
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
      databasePromise.then(function(db) {
        db.collection('subscriptions').insert([{id: id}]);
      });
      activeSubscriptionIds.push(id);
    }
  } else {
    activeSubscriptionIds.splice(index, 1);
    databasePromise.then(function(db) {
      db.collection('subscriptions').remove({id: id});
    });
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
    res.end('Request throttled. No cat spam!');
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
  databasePromise.then(function(db) {
    db.close();
  }).then(function() {
    server.close(function() {
      console.log("Closed out remaining connections.");
      process.exit()
    });
  });
}

// listen for TERM signal .e.g. kill
process.on ('SIGTERM', gracefulShutdown);
// listen for INT signal e.g. Ctrl-C
process.on ('SIGINT', gracefulShutdown);
