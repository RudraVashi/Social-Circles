require('dotenv').config();

const db = require('./database/db');

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const bodyParser = require('body-parser');
const session = require('express-session');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware setup - ORDER IS IMPORTANT
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Set up session BEFORE using any routes
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key', 
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 } // 1 hour session
}));

const scoresRouter = require('./routes/scores');
app.use('/score', scoresRouter);

app.post('/score/save-test', (req, res) => {
  console.log('Received score data:', req.body);
  res.json({ success: true, message: 'Test route works!' });
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes - ONLY AFTER all middleware is set up
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const authRoutes = require('./routes/authentication');
var accountinfoRouter = require('./routes/accountinfo');

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use(authRoutes);
app.use('/accountinfo', accountinfoRouter);

// app.get('/leaderboard', (req, res) => {
//   const players = [
//     { username: 'JohnDoe123', highScore: 300 },
//     { username: 'JaneSmith', highScore: 250 },
//     { username: 'CoolPlayer', highScore: 200 }
//   ];
  
//   res.render('leaderboard', { 
//     title: 'Leaderboard',
//     players,
//     user: req.session.user ? req.session.user : null
//   });
// });


app.get('/leaderboard', async (req, res) => {
  try {
      const [players] = await db.execute(`
          SELECT u.username, s.score
          FROM users u
          JOIN scores s ON u.id = s.user_id
          ORDER BY s.score DESC
          LIMIT 10
      `);

      res.render('leaderboard', {
          title: 'Leaderboard',
          players,
          user: req.session.user ? req.session.user : null
      });
  } catch (err) {
      console.error('Error fetching leaderboard data:', err);
      res.status(500).json({ success: false, message: "Database error" });
  }
});


//TODO: Logging out
app.get("/logout", (req, res) => {
  // Destroy the user's session and send them to the login page
  req.session.destroy((err) => {
    if (err){
      throw err;
    }
    res.redirect("/login");
  });
});



app.get('/characters', (req, res) => {
  res.render('characters');
});

// Error handlers
app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;