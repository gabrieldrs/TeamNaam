/**
 * Module dependencies.
 */
var express = require('express');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = require('morgan');
var errorHandler = require('errorhandler');
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
 * Controllers (route handlers).
 */
var homeController = require('./controllers/home');
var userController = require('./controllers/user');
var apiController = require('./controllers/api');
var contactController = require('./controllers/contact');

var cohortController = require('./controllers/cohort');
var applicationController = require('./controllers/application');
var tricsController = require('./controllers/trics');
var algoController = require('./controllers/algorithm');
var myalgoController = require('./controllers/algorithm mycopy'); //TODO Remove after Jonathan testing
var emailController = require('./controllers/emails');

/**
 * API keys and Passport configuration.
 */
var secrets = require('./config/secrets');
var passportConf = require('./config/passport');

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



/**
 * Primary app routes.
 */


app.get('/', passportConf.isAuthenticated, homeController.explorer);  // REDIRECT TO LAST COHORT
app.get('/2', passportConf.isAuthenticated, homeController.two);

app.get('/data/applications/:cid', passportConf.isAuthenticated, applicationController.getAllData);



app.get('/Emails', passportConf.isAuthenticated, emailController.getEmails);
app.post('/generateEmailsList', passportConf.isAuthenticated, emailController.postEmailsList);
//app.post('/matchupTest', passportConf.isAuthenticated, myalgoController.buttonFunction); //TODO Remove after jonathan testing
app.get('/Directory', passportConf.isAuthenticated, homeController.directory);
app.get('/Explorer', passportConf.isAuthenticated, homeController.explorer);
app.get('/Matching', passportConf.isAuthenticated, homeController.matching);
app.get('/Staging/Mentor', passportConf.isAuthenticated, homeController.stagingMentor);
app.get('/Staging/Student', passportConf.isAuthenticated, homeController.stagingStudent);

app.post('/matrix/set-weights', passportConf.isAuthenticated, algoController.setWeights);


app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);

app.get('/signup', function(req, res, next){
  if (req.isAuthenticated()) return next();
  else
    User.count({}).limit(1).count(function( err, count){
      console.log( "Number of users:", count );
      if (count === 0) next();
      else res.redirect('/login');
    });
}, userController.getSignup);

app.post('/signup', function(req, res, next){
  if (req.isAuthenticated()) return next();
  else
    User.count({}).limit(1).count(function( err, count){
      console.log( "Number of users:", count );
      if (count === 0) next();
      else res.redirect('/login');
    });
}, userController.postSignup);


app.get('/form', function(req, res) {
  req.flash('errors', { msg: 'Invalid student number' });
  req.flash('errors', { msg: 'Please provide an email address.' });
  req.flash('errors', { msg: 'Please provide your hobbies.' });
  res.render('pages/form', { title: 'CS Tri-Mentoring Application Form' });
});

app.get('/formClosed', applicationController.getFormClosedPage);
app.get('/thankyou', applicationController.getThankYouPage);
app.get('/form/mentor/:cid/:secret', applicationController.getMentorForm);
app.post('/form/mentor/:cid/:secret', applicationController.postMentorForm);
app.get('/form/student/:cid/:secret', applicationController.getStudentForm);
app.post('/form/student/:cid/:secret', applicationController.postStudentForm);

app.post('/form/delete', applicationController.deleteApplication);

app.get('/form/update/mentor/:cid/:secret/:aid', passportConf.isAuthenticated, applicationController.updateMentorForm);
app.post('/form/update/mentor/:cid/:secret/:aid', passportConf.isAuthenticated, applicationController.postUpdateMentorForm);
app.get('/form/update/student/:cid/:secret/:aid', passportConf.isAuthenticated, applicationController.updateStudentForm);
app.post('/form/update/student/:cid/:secret/:aid', passportConf.isAuthenticated, applicationController.postUpdateStudentForm);



app.get('/Cohort', passportConf.isAuthenticated, cohortController.cohort);
app.get('/set_cohort/:cid', passportConf.isAuthenticated, cohortController.setCohort);
app.get('/new_cohort', passportConf.isAuthenticated, cohortController.getNewCohort);
app.post('/update_cohort/:cid', passportConf.isAuthenticated, cohortController.updateCohort);
app.post('/delete_cohort/:cid', passportConf.isAuthenticated, cohortController.deleteCohort);

app.get('/staging/set_comment/:aid/:comment', passportConf.isAuthenticated, tricsController.setStagingComment);
app.get('/staging/set_tier/:aid/:tier', passportConf.isAuthenticated, tricsController.setStagingTier);
app.get('/staging/set_status/:aid/:status', passportConf.isAuthenticated, tricsController.setStagingStatus);

app.get('/account', passportConf.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConf.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConf.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConf.isAuthenticated, userController.postDeleteAccount);





/* ##############  DEPRECIATED BELOW  ################ */

app.get('/contact', contactController.getContact);
app.post('/contact', contactController.postContact);

app.get('/account/unlink/:provider', passportConf.isAuthenticated, userController.getOauthUnlink);

/**
 * API examples routes.
 */
app.get('/api', apiController.getApi);
app.get('/api/lastfm', apiController.getLastfm);
app.get('/api/nyt', apiController.getNewYorkTimes);
app.get('/api/aviary', apiController.getAviary);
app.get('/api/steam', apiController.getSteam);
app.get('/api/stripe', apiController.getStripe);
app.post('/api/stripe', apiController.postStripe);
app.get('/api/scraping', apiController.getScraping);
app.get('/api/twilio', apiController.getTwilio);
app.post('/api/twilio', apiController.postTwilio);
app.get('/api/clockwork', apiController.getClockwork);
app.post('/api/clockwork', apiController.postClockwork);
app.get('/api/foursquare', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getFoursquare);
app.get('/api/tumblr', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getTumblr);
app.get('/api/facebook', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getFacebook);
app.get('/api/github', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getGithub);
app.get('/api/twitter', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getTwitter);
app.post('/api/twitter', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.postTwitter);
app.get('/api/venmo', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getVenmo);
app.post('/api/venmo', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.postVenmo);
app.get('/api/linkedin', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getLinkedin);
app.get('/api/instagram', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getInstagram);
app.get('/api/yahoo', apiController.getYahoo);
app.get('/api/ordrin', apiController.getOrdrin);
app.get('/api/paypal', apiController.getPayPal);
app.get('/api/paypal/success', apiController.getPayPalSuccess);
app.get('/api/paypal/cancel', apiController.getPayPalCancel);

/**
 * OAuth authentication routes. (Sign in)
 */
app.get('/auth/instagram', passport.authenticate('instagram'));
app.get('/auth/instagram/callback', passport.authenticate('instagram', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_location'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/linkedin', passport.authenticate('linkedin', { state: 'SOME STATE' }));
app.get('/auth/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});

/**
 * OAuth authorization routes. (API examples)
 */
app.get('/auth/foursquare', passport.authorize('foursquare'));
app.get('/auth/foursquare/callback', passport.authorize('foursquare', { failureRedirect: '/api' }), function(req, res) {
  res.redirect('/api/foursquare');
});
app.get('/auth/tumblr', passport.authorize('tumblr'));
app.get('/auth/tumblr/callback', passport.authorize('tumblr', { failureRedirect: '/api' }), function(req, res) {
  res.redirect('/api/tumblr');
});
app.get('/auth/venmo', passport.authorize('venmo', { scope: 'make_payments access_profile access_balance access_email access_phone' }));
app.get('/auth/venmo/callback', passport.authorize('venmo', { failureRedirect: '/api' }), function(req, res) {
  res.redirect('/api/venmo');
});

/**
 * Error Handler.
 */
app.use(errorHandler());

// Handle 404
app.get('/404',applicationController.get404);
app.use(function(req, res) {
    res.status(400);
    res.render('404', {title: '404: File Not Found'});
});

// Handle 500
app.get('/500',applicationController.get500 );
app.use(function(error, req, res, next) {
    res.status(500);
    res.render('500', {title:'500: Internal Server Error', error: error});
});

/**
 * Start Express server.
 */
app.listen(app.get('port'), function() {
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

module.exports = app;
