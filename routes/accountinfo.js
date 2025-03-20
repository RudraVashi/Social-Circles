// Example in routes/accountinfo.js
var express = require('express');
var router = express.Router();

router.post('/', function(req, res, next) {
  // Process login data and then render account info page
  res.render('accountinfo', { title: 'Account Information' });
});

module.exports = router;
