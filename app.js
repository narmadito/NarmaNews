const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const rateLimit = require('express-rate-limit');

const connectDB = require('./db');
const User = require('./models/User');
const syncNews = require('./services/newsSyncService');

const indexRouter = require('./routes/index');
const newsRouter = require('./routes/news');
const apiRouter = require('./routes/api');
const authRouter = require('./routes/auth');

const app = express();

const dbFunction = typeof connectDB === 'function' ? connectDB : (connectDB.connectDB || (() => Promise.resolve()));
dbFunction().catch(err => console.error('Database connection error:', err));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-for-dev',
  resave: false,
  saveUninitialized: false
}));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  handler: (req, res) => {
    res.status(429).render('error', {
      message: 'You have made too many requests, please try again later.',
      error: { status: 429 }
    });
  }
});
app.use(limiter);

app.use(async (req, res, next) => {
  try {
    res.locals.user = req.session.userId ? await User.findById(req.session.userId) : null;
  } catch (err) {
    console.error(err);
    res.locals.user = null;
  }
  next();
});

app.use('/', indexRouter);
app.use('/news', newsRouter);
app.use('/api', apiRouter);
app.use('/auth', authRouter);

app.get('/ping', (req, res) => {
  res.status(200).send('OK');
});

app.startNewsSync = function(io) {
  syncNews(io).catch(err => console.error('Initial sync error:', err));

  setInterval(() => {
    syncNews(io).catch(err => console.error('Interval sync error:', err));
  }, 1000 * 60 * 60);
};

app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500).render('error');
});

module.exports = app;