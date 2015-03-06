var Cohort = require('../models/Cohort');
var Application = require('../models/Application');
var _ = require('lodash');





// Temporary local JSON to hold form data.    // This form holds BOTH student and mentor data.

/*
Possible RESERVED shortNames:
  comment,
  status
  student

  birthdate
  submissionDate  <-- or make relative time object?


NOTE:
  CASE SENSITIVE

*/
var formData=[
  {
    instruction: '',
    shortName: 'Student Number',
    help: 'You can do it!',
    type: 'string',
    required: true,
    analyze: false,   // DO NOT SEND DATA TO DASHBOARD
    mentor: false
  },
  {
    instruction: '',
    shortName: 'Company',
    help: 'You can do it!',
    type: 'string',
    required: true,
    analyze: true,   // WILL SEND DATA TO DASHBOARD
    student: false
  },

  {
    instruction: '',
    shortName: 'First Name',
    help: 'You can do it!',
    type: 'string',
    required: true,
    analyze: false,
  },

  {
    instruction: '',
    shortName: 'Last Name',
    help: 'You can do it!',
    type: 'string',
    required: false,
    analyze: false,
  },

  {
    instruction: '',
    shortName: 'Faculty',
    help: 'You can do it!',
    type: 'radioGroup',
    values: ['Arts','Engineering','Sciences','Sauder'],
    mentor: false
  },

  {
    instruction: 'Choose all that apply.',
    shortName: 'Availability',
    help: 'You can do it!',
    type: 'checkboxGroup',
    values: ['Monday','Tuesday','Wednesday','Thrusday','Friday']
  },

  {
    instruction: '',
    shortName: 'Ability to Code',
    help: 'You can do it!',
    type: 'range',
    min:0,
    step:1,
    max:10,
    required: true
  },

  {
    instruction: '',
    shortName: 'Birth Date',
    help: 'You can do it!',
    type: 'date',
  },

  {
    instruction: '',
    shortName: 'Academic Standing (Year)',
    help: 'You can do it!',
    type: 'integer',
    mentor: false
  }
]

///  GET /form/student/:cid/:secret
exports.getStudentForm = function(req, res) {
var secret=req.params.secret;
var cid=req.params.cid;

  Cohort.findById(cid).lean().exec(function( err, form){
    
    
    if ( form && form.status == false)      // the form is closed.
      res.redirect('/formClosed');
    else if ( form && form.secret==secret ){  
    
      var studentForms = _.filter( formData, function(formField){ return formField.student!==false; });  // only display the form fields relevant to students
      res.render('pages/formDynamic', { student: true, form: studentForms, title: 'CS Tri-Mentoring Application Form' });    
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
  
  // Check it too many fields were submitted
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
    var element = _.find(formData, { 'shortName': postKey })
    
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

  Cohort.findById(cid).lean().exec(function( err, form){
    
    
    if ( form && form.status == false)      // the form is closed.
      res.redirect('/formClosed');
    else if ( form && form.secret==secret ){    
    
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
    var element = _.find(formData, { 'shortName': postKey })
    
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





