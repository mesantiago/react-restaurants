var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var router = express.Router();
var mongoose = require('mongoose');

var config = require('./config.json');
var populate = require('./populate.js');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var restaurantsRouter = require('./routes/restaurants');
var collectionsRouter = require('./routes/collections');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api', router);
router.use('/users', usersRouter);
router.use('/restaurants', restaurantsRouter);
router.use('/collections', collectionsRouter);

// redirect all endpoints to index
app.use(function(req, res, next) {
  res.redirect('/');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// connect to database
app.connectToDatabase = function() {
  mongoose.set('useCreateIndex', true);
  mongoose.connect(config.mongodb, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  if (config.autopupulate) {
    populate.restaurants();
  }
}

module.exports = app;
