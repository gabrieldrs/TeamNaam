var errorHandler = require('errorhandler');


var user = require('./user');

var pager = require('./pager');
var control = require('./control');
var form = require('./form');


var passportConf = require('../config/passport');

module.exports = function (app) {

	
	//Administrator User config
	app.get('/login', user.getLogin);
	app.post('/login', user.postLogin);
	app.get('/logout', user.logout);
	app.get('/forgot', user.getForgot);
	app.post('/forgot', user.postForgot);
	app.get('/reset/:token', user.getReset);
	app.post('/reset/:token', user.postReset);
	app.post('/account/profile', passportConf.isAuthenticated, user.postUpdateProfile);
	app.post('/account/password', passportConf.isAuthenticated, user.postUpdatePassword);
	app.post('/account/delete', passportConf.isAuthenticated, user.postDeleteAccount);
	app.get('/account/unlink/:provider', passportConf.isAuthenticated, user.getOauthUnlink);
	app.get('/signup', user.isAuthenticated, user.getSignup);
	app.post('/signup', user.isAuthenticated, user.postSignup);
	
	// Administrative pages
	app.get(['/','/explorer','/matching'], passportConf.isAuthenticated, pager.matching);  // REDIRECT TO LAST COHORT
	app.get('/emails', passportConf.isAuthenticated, pager.email);
	app.get('/2', passportConf.isAuthenticated, pager.dataExplorer);
	app.get('/staging/:type', passportConf.isAuthenticated, pager.staging);
	app.get('/cohort', passportConf.isAuthenticated, pager.cohort);
	app.get('/account', passportConf.isAuthenticated, pager.account);
	
	//Administrative functions
	app.post('/generateEmailsList', passportConf.isAuthenticated, control.postEmailsList);
	app.post('/matrix/setWeights', passportConf.isAuthenticated, control.postWeights);
	app.get(['/form/:action','/form/:action/:type/:cid/:secret/:aid'], control.applicationDo);
	app.post('/form/:action/:type/:cid/:secret/:aid', passportConf.isAuthenticated, control.postApplicationDo);
	app.get(['/cohort/:action','/cohort/:action/:cid'], passportConf.isAuthenticated, control.cohortDo);
	app.post('/cohort/:action/:cid', passportConf.isAuthenticated, control.cohortDo);
	app.get('/staging/:action/:aid/:value', passportConf.isAuthenticated, control.stagingDo);

	// Form access
	app.get('/form/:type/:cid/:secret', form.getForm);
	app.post('/form/:type/:cid/:secret', form.postForm);
	app.get('/formClosed', form.getFormClosedPage);
	app.get('/thankyou', form.getThankYouPage);
	
	// are we using that for something?
	app.get('/data/applications/:cid', passportConf.isAuthenticated, form.getAllData);

	/**
	 * Error Handlers.
	 */
	app.use(errorHandler());

	// Handle 404
	var get404 = function(req,res){res.render('404', {title: '404: File Not Found'});	}
	app.get('/404',get404);
	app.use(function(req, res) {
		res.status(400);
		res.render('404', {title: '404: File Not Found'});
	});

	// Handle 500
	var get500 = function(req,res){res.render('500', {title:'500: Internal Server Error', error: error});}
	app.get('/500',get500 );
	app.use(function(error, req, res, next) {
		res.status(500);
		res.render('500', {title:'500: Internal Server Error', error: error});
	});
};