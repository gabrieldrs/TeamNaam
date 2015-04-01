var errorHandler = require('errorhandler');

var homeController = require('../controllers/home');
var cohortController = require('../controllers/cohort');
var tricsController = require('../controllers/trics');
var algoController = require('../controllers/algorithm');
var emailController = require('../controllers/emails');
var userController = require('../controllers/user');
var applicationController = require('../controllers/application');


var passportConf = require('../config/passport');

module.exports = function (app) {
	/**
	 * Primary app routes.
	 */
	
	
	app.get('/', passportConf.isAuthenticated, homeController.explorer);  // REDIRECT TO LAST COHORT
	app.get('/2', passportConf.isAuthenticated, homeController.two);
	app.get('/Directory', passportConf.isAuthenticated, homeController.directory);
	app.get('/Explorer', passportConf.isAuthenticated, homeController.explorer);
	app.get('/Matching', passportConf.isAuthenticated, homeController.matching);
	app.get('/Staging/Mentor', passportConf.isAuthenticated, homeController.stagingMentor);
	app.get('/Staging/Student', passportConf.isAuthenticated, homeController.stagingStudent);
	
	
	app.get('/Emails', passportConf.isAuthenticated, emailController.getEmails);
	app.post('/generateEmailsList', passportConf.isAuthenticated, emailController.postEmailsList);
//app.post('/matchupTest', passportConf.isAuthenticated, myalgoController.buttonFunction); //TODO Remove after jonathan testing
	
	
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
	app.get('/data/applications/:cid', passportConf.isAuthenticated, applicationController.getAllData);
	
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
	
	app.get('/account/unlink/:provider', passportConf.isAuthenticated, userController.getOauthUnlink);
	
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
	
	
};