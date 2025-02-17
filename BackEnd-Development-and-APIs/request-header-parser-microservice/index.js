require('dotenv').config();
var express = require('express');
var cors = require('cors');

var app = express();
app.use(cors());
app.use(express.static('public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get("/api/whoami", (req, res) => {
  res.json({
    ipaddress : req.headers['x-forwarded-for'] || req.socket.remoteAddress || "Unknown",
    language : req.headers["accept-language"] || "Unknown",
    software : req.headers["user-agent"] || "Unknown"
  });
});

var listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
