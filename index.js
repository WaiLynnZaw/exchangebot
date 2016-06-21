var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

// Server frontpage
app.get('/', function (req, res) {
    res.send('This is Exchange Rate Server');
});

// Facebook Webhook
app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'testbot_verify_token') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Invalid verify token');
    }
});

app.post('/webhook', function (req, res) {
  var events = req.body.entry[0].messaging;
  for (i = 0; i < events.length; i++) {
    var event = events[i];
    if (event.message && event.message.text) {
      if (!exchangeRateMessage(event.sender.id, event.message.text)) {
        sendMessage(event.sender.id, {text: "Echo: " + event.message.text});
      }
    } else if (event.postback) {
      console.log("Postback received: " + JSON.stringify(event.postback));
    }
  }
  res.sendStatus(200);
});

function sendMessage(recipientId, message) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};

function exchangeRateMessage(recipientId, text) {
  text = text || "";
  var values = text.split(' ');
  if (values.length === 2 && values[0] === 'USD') {
    if (Number(values[1]) > 0 ) {
      var api_url = "http://forex.cbm.gov.mm/api/latest";
      request(api_url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var data = JSON.parse(body);
          sendMessage(recipientId, {text: "MMK: " + data['info']});
        }else{
          res.status(401).json({"message":"Session Expired"});
        }
      });

      return true;
    }
  }
  return false;
};
