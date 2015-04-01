var Application = require('../models/Application');
var Cohort = require('../models/Cohort');
var _ = require('lodash');
var formLoader = require('./forms');

// Delete application
exports.deleteApplication = function(req, res) {
	Application.remove({ _id: req.body.aid }, function(err){
		if (err) res.status(500).json({ error: 'Application failed to be deleted.' });
		else res.status(200).json({});
	});
};

// Update Application
exports.updateApplication = function(req, res,type) {
	var secret=req.params.secret;
	var cid=req.params.cid;
	var aid=req.params.aid;
	
	Cohort.findById(cid).lean().exec(function( err, cohort){
		console.log(cohort,secret);
		if ( cohort && cohort.secret==secret ){
			var formData = formLoader.getForm(cohort.form);
			formData = _.filter( formData, function(formField){ return formField[type] == true; });  // only display the form fields relevant to students
			
			Application.findById(aid).lean().exec(function(err,app){
				if (err){
					console.error(err);
					req.flash('errors', { msg: 'Application form data failed to load. Try refreshing?' });
				}
				res.render('pages/formDynamic', { student: (type == 'student'), form: formData, title: 'CS Tri-Mentoring Application Form', cohortID: cid, secret: secret, application: app });
			});
		}else{
			req.flash('errors', { msg: 'Invalid form URL' });
			res.redirect('/404');
		}
	});
};

// Posts the result of the updated student's form
exports.postUpdateApplication = function(req, res,type) {
	var secret=req.params.secret;
	var cid=req.params.cid;
	var aid=req.params.aid;
	var errors=[];
	delete req.body._csrf; //delete the CSRF token now because it gets in the way, and isn't needed at the point in the controller.
	Cohort.findById(cid).lean().exec(function( err, cohort){
		if ( cohort && cohort.secret==secret ) {
			var formData = formLoader.getForm(cohort.form);
			// Check if too many fields were submitted
			if ( Object.keys(req.body).length > formData.length )
				errors.push({msg: 'You cannot submit more answers than their are questions!'});
			
			// Check if all required fields are submitted
			formData.forEach(function(element){
				if ( element[type] === true && element.required && ( req.body[element.name] == null || req.body[element.name] == '' )) {
					errors.push({msg: '"'+element.label+'" is a required field. Please fill it in.'});
				}
			});
			
			// Checks if all inputs are within range--if it is of type range.
			Object.keys(req.body).forEach(function(postKey) {
				var postVal = req.body[postKey];
				var element = _.find(formData, { 'name': postKey });
				
				if ( element[type]!==false ){
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
				return res.redirect('/form/update/'+type+'/' + cid + '/' + secret+'/'+aid)
			}
			
			
			delete req.body._csrf;
			console.log('req.body',req.body);
			Application.update({ _id: aid }, { $set: req.body }, function(err) {
				if (err) {
					req.flash('errors', {msg: 'Form could not be updated. Please try again later.'});
					res.redirect('/form/update/'+type+'/' + cid + '/' + secret+'/'+aid);
				}
				req.flash('success', {msg: 'Success!  Application updated!'});
				res.redirect('/staging/'+type);
			});
			
		}else{
			req.flash('errors', { msg: 'Invalid form URL' });
			res.redirect('/404');
		}
		
	});
}