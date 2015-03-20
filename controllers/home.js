var moment = require('moment');
var Application = require('../models/Application');
var Cohort = require('../models/Cohort');
var _ = require('lodash');
var formLoader = require('./forms');


/**
 * GET /
 * Home page.
 */

exports.directory = function(req, res) {
  res.render('pages/directory', {
    title: 'Home'
  });
};



exports.seniorMatching = function(req, res) {
  Application.find({ cohort: res.locals.activeCohort, $or: [{student: false},{senior: true}] }).lean().exec( function(err, applications){
    if (err){ 
      console.error(err);
      req.flash('errors', { msg: 'Failed to retrieve applications.' });
      // TODO add in HTTP 500 error code page.
    }
    var apps= _.groupBy(applications,student);    // Splits applications into subgroups by the senior Boolean (false means junior).
  });
    
  res.render('pages/juniorMatching', {
    title: 'Home',
    seniors: apps.true,
    mentors: apps.false
  });
};

exports.matching = function(req, res) {
  res.render('pages/seniorMatching', {
    title: 'Home'
  });
};

exports.juniorMatching = function(req, res) {
  Application.find({ cohort: res.locals.activeCohort, student: true }).lean().exec( function(err, applications){
    if (err){ 
      console.error(err);
      req.flash('errors', { msg: 'Failed to retrieve applications.' });
      // TODO add in HTTP 500 error code page.
    }
    var apps= _.groupBy(applications,seniors);    // Splits applications into subgroups by the senior Boolean (false means junior).
  });
    
  res.render('pages/juniorMatching', {
    title: 'Home',
    seniors: apps.true,
    juniors: apps.false
  });
};


exports.staging = function(req, res) {
  Application.find({ cohort: res.locals.activeCohort}).lean().exec( function(err, applications){
    if (err){ 
      console.error(err);
      req.flash('errors', { msg: 'Failed to retrieve applications.' });
    }
    var studentList = [];
    var mentorList = [];
    applications.forEach(function(app){    
        var yearsDOB  = moment().diff(app['Birth Date'], 'years');  // Gets remainder of weeks, converted to decimal, truncated to one decimal place.
        var weeksDOB  = Math.floor( moment().diff(app['Birth Date'], 'weeks') %52/5.2);
        
        app.name=app['First Name']+' '+ app['Last Name']
        app.age = yearsDOB +'.'+ weeksDOB +' years old'
        app.submissionMoment =moment(app.submissionDate).fromNow();
        if (app.student){
          studentList.push(app);
        }else{
         mentorList.push(app); 
        }
    }); 
    console.log(applications);
    
        
    res.render('pages/staging', {
      title: 'Staging',
      studentApp: studentList,
      mentorApp: mentorList
    }); 
  });
};


/*
 TODO:  This controller for the "explorer" page is temporarily here because of the form Variable.  IT should be moved back to the homeController later, when the formObject Variable is globally accissible as a file, global variable, or through mongoDB.  Presently it is a local variable, so this controller must be here.
 */

exports.explorer = function(req, res) {
    var cohort=res.locals.cohort;
    var formData = formLoader.getForm(cohort.form);
    if (formData) {
        var factors = formData.map(function (el) {
            return {
                shortName: el.shortName,
                weight: el.weight,
                analyze:el.analyze,
                field:el.analyzeField
            };
        });
    }
  console.log(factors);
    res.render('pages/explorer', {
        title: 'Home',
        factors: factors
    });
};
/*
 TODO:  This controller for the "explorer" page is temporarily here because of the form Variable.  IT should be moved back to the homeController later, when the formObject Variable is globally accissible as a file, global variable, or through mongoDB.  Presently it is a local variable, so this controller must be here.
 */
exports.two = function(req, res) {
    var cid=res.locals.cohort;
    Cohort.findById(cid).lean().exec(function( err, cohort){
        var formData = formLoader.getForm(cohort.form);
        var factors = formData.map(function(el) {
            return {
                shortName: el.shortName,
                weight: el.weight
            };
        });
        console.log(factors);
        res.render('pages/explorer2', {
            title: 'Home',
            factors: factors
        });
    });
};
