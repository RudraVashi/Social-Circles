var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  // renderInfo = { title: 'Social Circles' };
  // if (req.session.user){ // If the user is logged in, render with their info (so we can show their username and such)
  //   renderInfo["user"] = req.session.user;
  // }
  res.render('index', { title: 'Social Circles', user: req.session.user});
});

router.get('/login', function(req, res, next) {
  res.render('login', {title: 'Login', msg: ''});
});

router.get('/signup', function(req, res, next) {
  res.render('signup', {title: 'Sign Up'});
});

router.get('/', (req, res) => {
  console.log('User in session:', req.session.user);
});

module.exports = router;
