var Cohort = require('../models/Cohort');
var Application = require('../models/Application');
var _ = require('lodash');
var formLoader = require('./forms');


///  GET /form/student/:cid/:secret
exports.getStudentForm = function(req, res) {
var secret=req.params.secret;
var cid=req.params.cid;

  Cohort.findById(cid).lean().exec(function( err, cohort){
    if ( cohort && cohort.status == false)      // the form is closed.
      res.redirect('/formClosed');
    else if ( cohort && cohort.secret==secret ){
      var formData = formLoader.getForm(cohort.form);
      var formData = _.filter( formData, function(formField){ return formField.student!==false; });  // only display the form fields relevant to students
      res.render('pages/formDynamic', { student: true, form: formData, title: 'CS Tri-Mentoring Application Form' });
    }  
    else{
      req.flash('errors', { msg: 'Invalid form URL' });
      res.redirect('/404');
    }
  });
};




///  POST /form/student/:id/:secret
exports.postStudentForm = function(req, res) {
var secret=req.params.secret;
var cid=req.params.cid;
var errors=[];
delete req.body._csrf; //delete the CSRF token now because it gets in the way, and isn't needed at the point in the controller.
  
  // Check if too many fields were submitted
  if ( Object.keys(req.body).length > formData.length )
    errors.push('You cannot submit more answers than their are questions!');  
  
  // Check if all required fields are submitted
  formData.forEach(function(element){
    if ( element.student!==false && element.required && ( req.body[element.shortName] == null || req.body[element.shortName] == '' ))
      errors.push(postKey+' is a required field. Please fill it in.');
  });
  
  // Checks if all inputs are within range--if it is of type range.
  Object.keys(req.body).forEach(function(postKey) {
    var postVal = req.body[postKey];
    var element = _.find(formData, { 'shortName': postKey });
    
    if ( element.student!==false ){
      if ( element.type == 'date')
        req.body[postKey]=new Date( req.body[postKey] );   // Converts HTML date to JS Date
        
      if ( element.type == 'integer')
        req.body[postKey]=parseInt(postVal);
      
      if ( element.type == 'float')
        req.body[postKey]=parseFloat(postVal);
      
      if ( element.type == 'range'){
        req.body[postKey]=parseInt(postVal);
        
        if ( postVal < element.min )
          errors.push(postVal+' cannot be lower than '+min+'.');
        if ( postVal > element.max )    
          errors.push(postVal+' cannot be larger than '+max+'.');
      }
    }
  });

  if (errors.length) {
    req.flash('errors', errors);
    return res.redirect('/form/student/'+cid+'/'+secret);
  }
  
  Cohort.findOne({ _id: cid },function( err, form){
  
    if ( form && form.status == false)      // the form is closed.
      res.redirect('/formClosed');
      
    formData.filter(function(application){ return ( !application.mentor === false ) });
      
    if ( form && form.secret==secret ){
        req.body.student=true;
        req.body.cohort=form._id;
        var application = new Application(req.body);
        application.save(function(err) {
          if (err) {
            console.log(err);
            req.flash('errors', { msg: 'Your form could not be submitted. Please try again later.' });
            res.redirect('/form/student/'+cid+'/'+secret);
          }
          else req.flash('success', { msg: 'Success!  Application submitted!  An email will now be sent to you with a copy of your application.' });
          res.redirect('/thankyou');
        });
    }       
    else{
      req.flash('errors', { msg: 'Invalid form URL' });
      res.redirect('/404');
    }
  });
};



// -------------------------------------------------------------------


///  GET /form/mentor/:cid/:secret
exports.getMentorForm = function(req, res) {
var secret=req.params.secret;
var cid=req.params.cid;

  Cohort.findById(cid).lean().exec(function( err, cohort){
    if ( cohort && cohort.status == false)      // the form is closed.
      res.redirect('/formClosed');
    else if ( cohort && cohort.secret==secret ){
      var formData = formLoader.getForm(cohort.form);
      var mentorForms = _.filter( formData, function(formField){ return formField.mentor!==false; });    // Shows only fields relevant to mentors
      res.render('pages/formDynamic', { student: false, form: mentorForms, title: 'CS Tri-Mentoring Application Form' });    
    }  
    else{
      req.flash('errors', { msg: 'Invalid form URL' });
      res.redirect('/404');
    }
  });
};




///  POST /form/mentor/:id/:secret
exports.postMentorForm = function(req, res) {
var secret=req.params.secret;
var cid=req.params.cid;
var errors=[];
delete req.body._csrf; //delete the CSRF token now because it gets in the way, and isn't needed at the point in the controller.
  
  // Check it too many fields were submitted
  if ( Object.keys(req.body).length > formData.length )
    errors.push('You cannot submit more answers than their are questions!');  
  
  // Check if all required fields are submitted
  formData.forEach(function(element){
    if ( element.mentor!==false && element.required && ( req.body[element.shortName] == null || req.body[element.shortName] == '' ))
      errors.push(postKey+' is a required field. Please fill it in.');
  });
  
  // Checks if all inputs are within range--if it is of type range.
  Object.keys(req.body).forEach(function(postKey) {
    var postVal = req.body[postKey];
    var element = _.find(formData, { 'shortName': postKey });
    
    if ( element.mentor!==false){
      if ( element.type == 'date')
        req.body[postKey]=new Date( req.body[postKey] );   // Converts HTML date to JS Date
        
      if ( element.type == 'integer')
        req.body[postKey]=parseInt(postVal);
      
      if ( element.type == 'float')
        req.body[postKey]=parseFloat(postVal);
      
      if ( element.type == 'range'){
        req.body[postKey]=parseInt(postVal);
        
        if ( postVal < element.min )
          errors.push(postVal+' cannot be lower than '+min+'.');
        if ( postVal > element.max )    
          errors.push(postVal+' cannot be larger than '+max+'.');
      }
    }
  });

  if (errors.length) {
    req.flash('errors', errors);
    return res.redirect('/form/mentor/'+cid+'/'+secret);
  }
  
  Cohort.findOne({ _id: cid },function( err, form){
  
    if ( form && form.status == false)      // the form is closed.
      res.redirect('/formClosed');
      
    if ( form && form.secret==secret ){
        req.body.student=false;
        req.body.cohort=form._id;
        var application = new Application(req.body);
        application.save(function(err) {
          if (err) {
            console.log(err);
            req.flash('errors', { msg: 'Your form could not be submitted. Please try again later.' });
            res.redirect('/form/mentor/'+cid+'/'+secret);
          }
          else req.flash('success', { msg: 'Success!  Application submitted!  An email will now be sent to you with a copy of your application.' });
          res.redirect('/thankyou');
        });
    }       
    else{
      req.flash('errors', { msg: 'Invalid form URL' });
      res.redirect('/404');
    }
  });
};

exports.getFormClosedPage = function(req,res){
    res.render('pages/formClosed', {title: 'This session is closed.' });
};
exports.getThankYouPage = function(req,res){
    res.render('pages/thankYou', {title: 'Thank you for your submission!' });
};

exports.get404 = function(req,res){
    res.render('404', {title: '404: File Not Found'});
}
exports.get500 = function(req,res){
    res.render('500', {title:'500: Internal Server Error', error: error});
}


