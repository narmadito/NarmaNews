var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var syncNews = require('./services/newsSyncService');
var connectDB = require('./db');

var User = require('./models/User');

var indexRouter = require('./routes/index');
var newsRouter = require('./routes/news');
var apiRouter = require('./routes/api');
var authRouter = require('./routes/auth');


connectDB();

// syncNews();
// setInterval(syncNews, 1000 * 60 * 60);

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
  secret: 'narmanews-secret',
  resave: false,
  saveUninitialized: false
}));

app.use(async (req, res, next) => {
  try {
    if (req.session.userId) {
      res.locals.user = await User.findById(req.session.userId);
    } else {
      res.locals.user = null;
    }
  } catch (err) {
    console.error(err);
    res.locals.user = null;
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/news', newsRouter);
app.use('/api', apiRouter);
app.use('/auth', authRouter);

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