var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Social Circles' });
});

router.get('/login', function(req, res, next) {
  res.render('login', {title: 'Login'});
});

router.get('/signup', function(req, res, next) {
  res.render('signup', {title: 'Sign Up'});
});

router.get('/', (req, res) => {
  console.log('User in session:', req.session.user);
});

module.exports = router;
