var express    = require('express');
var http       = require('http');
var bodyParser = require("body-parser");
var config = require('./config')

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));

var activeSubscriptionIds = [];

var server = app.listen(3000, function () {
  console.log('Started server at http://%s:%s', server.address().address, server.address().port);
});

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

app.get('/push_cats', function (req, res) {
  var data = {
    "delayWhileIdle":true,
    "timeToLive":3,
    "registration_ids":activeSubscriptionIds
  };

  var dataString =  JSON.stringify(data);
  var headers = {
    'Authorization' : 'key=' + config.apiKey,
    'Content-Type' : 'application/json',
    'Content-Length' : dataString.length
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

});
