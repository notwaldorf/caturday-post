var express    = require('express');
var http       = require('http');
var bodyParser = require("body-parser");
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

  console.log(activeSubscriptionIds);
  res.end("yes");
});

app.get('/get_subscription_count', function (req, res) {
  res.json({'subscriptions': activeSubscriptionIds.length});
});
