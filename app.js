/**
 * Module dependencies.
 */
var express = require('express');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = require('morgan');

var lusca = require('lusca');
var methodOverride = require('method-override');
var multer  = require('multer');

var _ = require('lodash');
var MongoStore = require('connect-mongo')(session);
var flash = require('express-flash');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var expressValidator = require('express-validator');
var connectAssets = require('connect-assets');


var User = require('./models/User');
var Cohort = require('./models/Cohort');

/**
 * API keys and Passport configuration.
 */
var secrets = require('./config/secrets');

/**
 * Create Express server.
 */
var app = express();

/**
 * Connect to MongoDB.
 */
mongoose.connect(secrets.db);
mongoose.connection.on('error', function() {
  console.error('MongoDB Connection Error. Please make sure that MongoDB is running.');
});

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(compress());
app.use(connectAssets({
  paths: [path.join(__dirname, 'public/css'), path.join(__dirname, 'public/js')]
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer({ dest: path.join(__dirname, 'uploads') }));
app.use(expressValidator());
app.use(methodOverride());
app.use(cookieParser());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: secrets.sessionSecret,
  store: new MongoStore({ url: secrets.db, autoReconnect: true })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(lusca({
  csrf: true,
  xframe: 'SAMEORIGIN',
  xssProtection: true
}));
app.use(function(req, res, next) {
  res.locals.user = req.user;
  next();
});
app.use(function(req, res, next) {
  if (/api/i.test(req.path)) req.session.returnTo = req.path;
  next();
});
app.use(function(req, res, next) {  // This lets us signup users when no users are signed up.
  User.count({}).limit(1).count(function( err, count ){
    res.locals.userCount = !!count;
    next();
  });
});

app.use(function(req, res, next) {  // This lets us display the available cohorts, and the activeCohort document

  res.locals.activeCohort=req.session.activeCohort;
  Cohort.find(function( err, cohorts){


    // TODO: What to do if err?????

    if ( cohorts.length == 0){
          var cohort = new Cohort({ title: 'Default Cohort' });         
          cohort.save(function(err,cohort) {
            if (err) {console.log(err); }
            else{
              res.locals.cohort=cohort;
              res.locals.cohorts=[cohort];
              req.session.activeCohort=cohort._id;
              next();
            }
          });
    }
    else{

      res.locals.cohorts=cohorts;

      var aC= _.where(cohorts, {id: res.locals.activeCohort});
      var cohort= aC.length? aC[0] : cohorts[0];
      
      if (!aC.length)
        req.session.activeCohort=cohorts[0]._id;
      
      // This will atleast prevent some errors down the road???
      // Maybe we can make a new cohort
      res.locals.cohort=cohort? cohort : {};
      
      //console.log("JHAWN checkpoint",cohort,cohorts,aC,res.locals.activeCohort);
      next();
    }
  });
});

app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

require('./controllers')(app);

/**
 * Start Express server.
 */
app.listen(app.get('port'), function() {
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

module.exports = app;
