var Cohort = require('../models/Cohort');
var Application = require('../models/Application');
var _ = require('lodash');
var formLoader = require('./formLoader');


// are we using that for something?
exports.getAllData = function(req, res) {
	var cid=req.params.cid;
	Application.find({ cohort: cid}).lean().exec(function(err,apps){
		if (err){
			console.error(err);
			res.status(500).json({ error: 'Failed to load applications data.' });
		}
		else {
			var formName = (res.locals.cohort || {} ).form;
			console.log('res.locals.cohorts:',res.locals.cohorts);
			console.log('FormName:',formName);
			var form = formLoader.getForm( formName );
			console.log('Form:',form);
			res.status(200).json({ data: apps, form: form });
		}
	});
}






///  Get the user form
exports.getForm = function(req, res) {
	var secret=req.params.secret;
	var cid=req.params.cid;
	var type = req.params.type;
	Cohort.findById(cid).lean().exec(function( err, cohort){
		if ( cohort && cohort.status == false)      // the form is closed.
			res.redirect('/formClosed');
		else if ( cohort && cohort.secret==secret ){
			var formData = formLoader.getForm(cohort.form);
			console.log(formData);
			var formData = _.filter( formData, function(formField){ return formField[type]==true; });  // only display the form fields relevant to students
			res.render('pages/formDynamic', { student: (type == 'student'), form: formData, title: 'CS Tri-Mentoring Application Form', cohortID: cid, secret: secret, application: {}});
		}else{
			req.flash('errors', { msg: 'Invalid form URL' });
			res.redirect('/404');
		}
	});
};



///  Post the user form
exports.postForm = function(req, res) {
	var secret=req.params.secret;
	var cid=req.params.cid;
	var type = req.params.type;
	var errors=[];
	delete req.body._csrf; //delete the CSRF token now because it gets in the way, and isn't needed at the point in the controller.
	Cohort.findById(cid).lean().exec(function( err, cohort){
		if ( cohort && cohort.status == false)      // the form is closed.
			res.redirect('/formClosed');
		else if ( cohort && cohort.secret==secret ) {
			var formData = formLoader.getForm(cohort.form);
			// Check if too many fields were submitted
			if ( Object.keys(req.body).length > formData.length )
				errors.push({msg: 'You cannot submit more answers than their are questions!'});
			
			// Check if all required fields are submitted
			formData.forEach(function(element){
				if ( element[type]==true && element.required && ( req.body[element.name] == null || req.body[element.name] == '' ))
					errors.push({msg: element.label+' is a required field. Please fill it in.'});
			});
			
			// Checks if all inputs are within range--if it is of type range.
			Object.keys(req.body).forEach(function(postKey) {
				var postVal = req.body[postKey];
				var element = _.find(formData, { 'name': postKey });
				
				if ( element[type]==true ){
					if ( element.type == 'date')
						req.body[postKey]=new Date( req.body[postKey] );   // Converts HTML date to JS Date
					
					if ( element.type == 'integer')
						req.body[postKey]=parseInt(postVal);
					
					if ( element.type == 'float')
						req.body[postKey]=parseFloat(postVal);
					
					if ( element.type == 'range'){
						req.body[postKey]=parseInt(postVal);
						
						if ( postVal < element.min )
							errors.push({msg: postVal+' cannot be lower than '+min+'.'});
						if ( postVal > element.max )
							errors.push({msg: postVal+' cannot be larger than '+max+'.'});
					}
				}
			});
			
			
			if (errors.length) {
				console.log("ERRORS:",errors);
				req.flash('errors', errors);
				return res.redirect('/form/'+type+'/'+cid+'/'+secret);
			}
			
			var query = {};
			query.cohort = cid;
			console.log(req.body.studentNo)
			if (req.body.studentNo != undefined){
				query.studentNo = req.body.studentNo;
			}else {
				query.phoneNumber = req.body.phoneNumber;
			}
			Application.count(query).limit(1).count(function( err, count){
				if (count) {
					console.log('An application with the same '+((type == 'student')?"student number":"phone number")+' has already been submitted!',err,count);
					req.flash('errors',{msg: 'An application with the same '+((type == 'student')?"student number":"phone number")+' has already been submitted!'});
					return res.redirect('/form/'+type+'/'+cid+'/'+secret);
				}
				if (err) {
					console.error(err);
					req.flash('errors',{msg: 'Something went wrong!'});
					return res.redirect('/form/'+type+'/'+cid+'/'+secret);
				}
				
				req.body.student=(type == 'student');
				req.body.cohort=cohort._id;
				var application = new Application(req.body);
				application.save(function(err) {
					if (err) {
						req.flash('errors', {msg: 'Your form could not be submitted. Please try again later.'});
						res.redirect('/form/'+type+'/' + cid + '/' + secret);
					}
					req.flash('success', {msg: 'Success!  Application submitted!'});
					res.redirect('/thankyou');
				});
			});
			
		}else{
			req.flash('errors', { msg: 'Invalid form URL' });
			res.redirect('/404');
		}
		
	});
};

// Show the form closed page
exports.getFormClosedPage = function(req,res){
	res.render('pages/formClosed', {title: 'This session is closed.' });
};

// Show the thank you page
exports.getThankYouPage = function(req,res){
	res.render('pages/thankYou', {title: 'Thank you for your submission!' });
};
