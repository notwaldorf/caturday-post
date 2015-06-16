var express    = require('express');
var http       = require('http');
var bodyParser = require("body-parser");

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.set('port', process.env.PORT || 3000);

var activeSubscriptionIds = [];

http.createServer(app).listen(app.get('port'), function() {
  console.log('Started server on port ' + app.get('port'));
});

// This is what <platinum-push-messaging> uses as the notification content,
// so we should intercept it and do something better with it. Like get it from
// a giant cat server.
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

app.get('/manifest.json', function (req, res) {
  res.json({
    "gcm_sender_id": process.env.GCM_SENDER,
  	"gcm_user_visible_only": true
  });
});

// Add or remove a client.
app.post('/subscription_change', function (req, res) {
  var enabled = req.body.enabled;
  var id = req.body.id;
  var index = activeSubscriptionIds.indexOf(id);

  if (enabled == 'true') {
    if (index == -1)
      activeSubscriptionIds.push(id);
  } else {
    var index = activeSubscriptionIds.indexOf(id)
    activeSubscriptionIds.splice(index,1);
  }
  res.end("yes");
});

app.get('/get_subscription_count', function (req, res) {
  res.json({'subscriptions': activeSubscriptionIds.length});
});

// Send cats to everyone!!
app.get('/push_cats', function (req, res) {
  var data = {
    "delayWhileIdle":true,
    "timeToLive":3,
    "data":{
      'title': 'this is an important cat notification',
      'message': 'click on it. click on the cat.'
    },
    "registration_ids":activeSubscriptionIds
  };

  console.log(activeSubscriptionIds);

  var dataString =  JSON.stringify(data);
  var headers = {
    'Authorization' : 'key=' + process.env.API_KEY,
    'Content-Type' : 'application/json'
  };

  console.log(headers)

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

});
