require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const urlParser = require('url');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// Solution
// In-memory database to store URLs
let urlDatabase = {};
let counter = 1;

// API Endpoint to shorten URLs
app.post('/api/shorturl', (req, res) => {
  const  { url }  = req.body;

  // Parse and validate URL
  const parsedUrl = urlParser.parse(url);
  if (!parsedUrl.hostname) {
    return res.json({ error: 'invalid url' });
  }

  // DNS Lookup to check if the hostname is valid
  dns.lookup(parsedUrl.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Store the URL and return the shortened version
    const shortUrl = counter;
    urlDatabase[shortUrl] = url;
    counter++;

    res.json({ original_url: url, short_url: shortUrl });
  });
});

// Redirect from short URL
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = parseInt(req.params.short_url);

  if (urlDatabase[shortUrl]) {
    return res.redirect(urlDatabase[shortUrl]);
  } else {
    return res.json({ error: 'No short URL found for the given input' });
  }
});
// Solution

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
