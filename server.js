var express = require('express')
var bodyParser = require('body-parser');
var multer = require('multer'); 
var emails = require('./emails.js');
var mandrill = require('mandrill-api/mandrill');

var app = express();
var mandrill_client = new mandrill.Mandrill('kxQ8B48RVKjaRJlCd7JvPg');

//  Needed for 'req.body'
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());

app.post('/', function(req, res) {
  //  If the _gotcha field has a value, it's most likely a bot filling out
  //  the form. Fail silently.
  if (req.body._gotcha) {
    res.redirect(req.body._next || req.get('Referrer'));
    return;
  }

  //  Create an email message based on post values
  var message = {
    'text': req.body.message || 'No message was provided',
    'subject': req.body._subject || 'Email from NodeMailForm',
    'from_email': req.body._replyto,
    'from_name': req.body.name,
    'to': [{
      'email': emails[req.query.key].email,
      'name': emails[req.query.key].name,
      'type': 'to'
    },
    {
      'email': req.body._cc,
      'type': 'cc'
    }]
  }

  //  Send the message!
  mandrill_client.messages.send(
    {
      'message': message,
      'async': false
    },
    function(result) {
      res.redirect(req.body._next || req.get('Referrer'));
    },
    function(e) {
      console.log('Error sending email: ' + e.name + ' - ' + e.message);
      res.status(500).send({ error: 'Error sending email' });
    }
  );
});

var server = app.listen(process.env.port || 8000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('NodeMailForm listening at http://%s:%s', host, port);
})
