var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');

var indexRouter = require('./routes/index');
var properties = require('./conf/oauth-properties.json')
var appInfoController = require('./controllers/appInfoController');
var onPremiseAppActivationController = require('./controllers/onPremiseAppActivationController');

var app = express();

global.appRoot = path.resolve(__dirname);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.listen(properties.node.port, () => console.log("Server listening on port :"+properties.node.port));

app.use(logger('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


app.use('/auth', indexRouter);

/* Get app informaton */
app.get('/appInfo', appInfoController.getAppInfo)

app.get('/auth/activate', onPremiseAppActivationController.activationKeyDashboard)

app.get('/auth/setup', onPremiseAppActivationController.setupSteps)

app.get('/auth/home', onPremiseAppActivationController.setupHome)

app.get('/auth/activateOnPremiseApp', onPremiseAppActivationController.setupSteps)

app.post('/auth/validateOnPremiseApp', onPremiseAppActivationController.activateOnPremiseApp)

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

module.exports = app;
