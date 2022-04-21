const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const debug = require('debug')('point-server:app');
const cors = require('cors');

const config = require('./services/config.js');
const storeS3 = require('./services/storeS3.js');
config.init();
storeS3.init();

const indexRouter = require('./routes/index');
const pointsRouter = require('./routes/points');

const version = process.env.npm_package_version;

debug('start point server version ' + version);

const app = express();
app.use(cors());

// NODE_ENV env var undefined means 'development' ; used to render errors during dev.
if (app.get('env') === 'development') {
  debug('mode development');
}

// view engine setup
if (app.get('env') === 'development') {
  app.use('/favicon.ico', express.static('public/images/favicon.ico'));
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'pug');
}

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/points', pointsRouter);

// error handler
app.use(function(err, req, res, next) {
  if (req.app.get('env') === 'development') {
    res.locals.message = err.message;
    res.locals.error = err;
    console.log(err);
    res.status(err.status || 500).render('error');
  } else {
    res.status(500).json({id:'SERVICE_UNAVAILABLE', error: 'Service Unavailable'});
  }
});

module.exports = app;
