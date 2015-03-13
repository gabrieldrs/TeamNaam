var moment = require('moment');
var Application = require('../models/Application');
var _ = require('lodash');


/**
 * GET /
 * Home page.
 */



exports.emails = function(req, res) {
  res.render('pages/emails', {
    title: 'Home'
  });
};

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
  Application.find({ cohort: res.locals.activeCohort , student: true }).lean().exec( function(err, applications){
    if (err){ 
      console.error(err);
      req.flash('errors', { msg: 'Failed to retrieve applications.' });
    }
    
    applications.forEach(function(app){    
        var yearsDOB  = moment().diff(app['Birth Date'], 'years');  // Gets remainder of weeks, converted to decimal, truncated to one decimal place.
        var weeksDOB  = Math.floor( moment().diff(app['Birth Date'], 'weeks') %52/5.2);
        
        app.name=app['First Name']+' '+ app['Last Name']
        app.age = yearsDOB +'.'+ weeksDOB +' years old'
        app.submissionMoment =moment(app.submissionDate).fromNow();
    }); 
    console.log(applications);
    
        
    res.render('pages/staging', {
      title: 'Staging',
      applications: applications
    }); 
  });
};




