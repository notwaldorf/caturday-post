var express = require('express');
var http = require('http');

var app = express();
app.use(express.static(__dirname + '/public'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));

var server = app.listen(3000, function () {
  console.log('Started server at http://%s:%s', server.address().address, server.address().port);
});

app.post('/subscription_change', function (req, res) {
  console.log(req.query['id']);
  //console.log("received", req);
});
