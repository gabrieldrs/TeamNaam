var moment = require('moment');
var Application = require('../models/Application');
var Cohort = require('../models/Cohort');
var _ = require('lodash');
var formLoader = require('./forms');
var fs = require('fs');


//Main administrator page
exports.matching = function(req, res) {
	var cohort=res.locals.cohort;
	var formData = formLoader.getForm(cohort.form);
	if (formData) {
		var factors = formData.map(function (el) {
			
			if (el.analyze == true) {
				return {
					label: el.label,
					name:el.name,
					weight: el.weight,
					analyzeRef: el.analyzeRef
				};
			}
		});
	}
	res.render('pages/explorer', {
		title: 'Matching',
		factors: factors
	});
};

//Email list Generation page
exports.email = function(req, res) {
	res.render('pages/emails', {
		title: 'Email List Generation'
	});
};

//Data Explorer page
exports.dataExplorer = function(req, res) {
	var cid=res.locals.cohort;
	Cohort.findById(cid).lean().exec(function( err, cohort){
		var formData = formLoader.getForm(cohort.form);
		var factors = formData.map(function(el) {
			return {
				label: el.label,
				name:el.name,
				weight: el.weight,
				analyzeRef: el.analyzeRef
			};
		});
		console.log(factors);
		res.render('pages/explorer2', {
			title: 'Data Explorer',
			factors: factors
		});
	});
};

//Staging page
exports.staging = function(req, res) {
	var type = req.params.type;
	if (type=="Mentor"){
		mentorStaging(req, res);
	}else{
		studentStaging(req, res);
	}
};

//Mentor Staging page
function mentorStaging(req, res){
	Application.find({ cohort: res.locals.activeCohort, student: false }).lean().exec( function(err, applications){
		if (err){
			console.error(err);
			req.flash('errors', { msg: 'Failed to retrieve applications.' });
		}
		var mentorList = [];
		applications.forEach(function(app){
			var yearsDOB  = moment().diff(app['age'], 'years');  // Gets remainder of weeks, converted to decimal, truncated to one decimal place.
			var weeksDOB  = Math.floor( moment().diff(app['age'], 'weeks') %52/5.2);
			
			app.name=app['fName']+' '+ app['lName'];
			app.age = yearsDOB +'.'+ weeksDOB +' years old';
			app.faculty = "";
			app.adminComment = (app.adminComment)?app.adminComment:"";
			app.submissionMoment =moment(app.submissionDate).fromNow();
			mentorList.push(app);
		});
		
		res.render('pages/stagingMentor', {
			title: 'Mentor Staging',
			mentorApp: mentorList
		});
	});
}

//Student staging page
function studentStaging(req, res) {
	Application.find({ cohort: res.locals.activeCohort, student: true }).lean().exec( function(err, applications){
		if (err){
			console.error(err);
			req.flash('errors', { msg: 'Failed to retrieve applications.' });
		}
		var studentList = [];
		applications.forEach(function(app){
			var yearsDOB  = moment().diff(app['age'], 'years');  // Gets remainder of weeks, converted to decimal, truncated to one decimal place.
			var weeksDOB  = Math.floor( moment().diff(app['age'], 'weeks') %52/5.2);
			
			app.name=app['fName']+' '+ app['lName'];
			app.age = yearsDOB +'.'+ weeksDOB +' years old';
			app.faculty = "";
			app.adminComment = (app.adminComment)?app.adminComment:"";
			app.submissionMoment =moment(app.submissionDate).fromNow();
			studentList.push(app);
		});
		
		res.render('pages/stagingStudent', {
			title: 'Student Staging',
			studentApp: studentList
		});
	});
};

// Cohorts page
exports.cohort = function(req, res) {
	
	Cohort.findById(res.locals.activeCohort, function (err, c) {
		if (err){
			console.error(err);
			req.flash('errors', { msg: err });
			res.redirect('/500');
		}
		Application.count({cohort: res.locals.activeCohort }).limit(1).count(function( err, count){
			
			console.log(count, (count));
			if (count)    // IF there are any submitted applications, we lock the questionnaire used.
				c.formLock = true;
			else
				c.formLock = false;
			
			c.save(function(err) {
				if (err){
					console.error(err);
					req.flash('errors', { msg: err });
				}
				
				var formNames = formLoader.getAllFormNames();
				res.render('pages/cohort', {
					title: 'Cohort Settings',
					forms: formNames,
					cohort: c,/* This overrides the cohort field set as middleware in app.js.  If we don't do this the cohort 
												object rendered on the page will not show the lock for one more page load */
					host: req.get('host')
				});
			});
			
		});
	});
};

// Profile page
exports.account = function(req, res) {
	res.render('account/profile', {
		title: 'Account Management'
	});
};