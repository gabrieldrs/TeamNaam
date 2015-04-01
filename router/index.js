var errorHandler = require('errorhandler');


var userController = require('../controllers/user');
var applicationController = require('../controllers/application');

var pager = require('../controllers/pager');
var control = require('../controllers/control');


var passportConf = require('../config/passport');

module.exports = function (app) {

	
	// Administrative pages
	app.get(['/','/explorer','/matching'], passportConf.isAuthenticated, pager.matching);  // REDIRECT TO LAST COHORT
	app.get('/emails', passportConf.isAuthenticated, pager.email);
	app.get('/2', passportConf.isAuthenticated, pager.dataExplorer);
	app.get('/staging/:type', passportConf.isAuthenticated, pager.staging);
	app.get('/cohort', passportConf.isAuthenticated, pager.cohort);
	app.get('/account', passportConf.isAuthenticated, pager.account);
	
	//Administrative functions
	app.post('/generateEmailsList', passportConf.isAuthenticated, control.postEmailsList);
	app.post('/matrix/setWeights', passportConf.isAuthenticated, control.setWeights);
	
	
	app.get(['/form/:action','/form/:action/:type/:cid/:secret/:aid'], control.applicationDo);
	app.post('/form/:action/:type/:cid/:secret/:aid', passportConf.isAuthenticated, control.postApplicationDo);
	
	app.get(['/cohort/:action','/cohort/:action/:cid'], passportConf.isAuthenticated, control.cohortDo);
	app.post('/cohort/:action/:cid', passportConf.isAuthenticated, control.cohortDo);
	
	app.get('/staging/:action/:aid/:value', passportConf.isAuthenticated, control.stagingDo);

	
	
	
	
	
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
	
	
	// are we using that for something?
	app.get('/data/applications/:cid', passportConf.isAuthenticated, applicationController.getAllData);
	
	
	
	
	
	
	
	
	
	
	
	
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