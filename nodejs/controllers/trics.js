var Cohort = require('../models/Cohort');
var Application = require('../models/Application');
var _ = require('lodash');




///  GET /set_cohort/:cid
exports.setCohort = function(req, res) {
  req.session.activeCohort=req.params.cid;
  res.redirect('/');
};


///  GET /update_cohort/:cid
exports.updateCohort = function(req, res) {
  Cohort.findById( req.params.cid, function(err, cohort) {
    if (err){ 
      console.error(err);
      req.flash('errors', { msg: 'Cohort failed to be updated.' });
      return res.redirect('/Cohort');
    }
    
    console.log(" req.body:", req.body);
    
    cohort.title = req.body.title || 'cohort ?';
    cohort.description = req.body.description || '';
    cohort.status = req.body.status || false;
    cohort.form = req.body.form || 1;
    cohort.secret = req.body.secret || '';

    cohort.save(function(err) {
      if (err){
         console.error(err);
         req.flash('errors', { msg: 'Cohort failed to be updated.' });
      }
      else req.flash('info', { msg: 'Cohort information updated.' });
      res.redirect('/Cohort');
    });
  });
};

///  GET /delete_cohort/:cid
exports.deleteCohort = function(req, res) {
  Cohort.remove({ _id: req.params.cid }, function(err, cohort){
    if (err) req.flash('errors', { msg: 'Cohort failed to be deleted.' });
    else req.flash('info', { msg: 'Cohort successfully deleted.' });
    
    Application.remove({ cohort: req.params.cid }, function(err, apps){
        Cohort.findOne().sort('-_id').exec(function(err,newCohort){
            req.session.activeCohort = newCohort ? newCohort._id : null;     //    <<----------------------------------------- TODO
            res.redirect('/Cohort');    
        });     
    });
  }); 
};


///  GET /new_cohort/
exports.getNewCohort = function(req, res) {

    Cohort.count({}).count(function( err, count){
        count++;
        var cohort = new Cohort({
          title: 'cohort '+count
        });

        cohort.save(function(err,cohort) {
          if (err) {console.log(err); req.flash('errors', { msg: 'Your cohort could not be created.' }); }
          else{
            req.flash('info', { msg: 'Your new cohort has been created.' });
            req.session.activeCohort=cohort._id;
            console.log('cohort._id:',cohort._id);
          }
          res.redirect('/Cohort');
        });        
        
    });
};




var formData=[
  {
    instruction: '',
    shortName: 'Student Number',
    help: 'You can do it!',
    type: 'string',
    required: true,
    analyze: false,   // DO NOT SEND DATA TO DASHBOARD
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
    values: ['Arts','Engineering','Sciences','Sauder']
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
  }
]

///  GET /form/:cid/:secret
exports.getForm = function(req, res) {
var secret=req.params.secret;
var cid=req.params.cid;

  Cohort.findById(cid ,function( err, form){
    console.log('form:',form, cid,secret);
    
    if ( form && form.status == false)      // the form is closed.
      res.redirect('/formClosed');
    if ( form && form.secret==secret ){    
      res.render('pages/formDynamic', { form: formData, title: 'CS Tri-Mentoring Application Form' });    
    }  
    else{
      req.flash('errors', { msg: 'Invalid form URL' });
      res.redirect('/404');
    }
  });
};




///  POST /form/:id/:secret
exports.postForm = function(req, res) {
var secret=req.params.secret;
var cid=req.params.cid;
var errors=[];
delete req.body._csrf; //delete the CSRF token now because it gets in the way, and isn't needed at the point in the controller.
  
  // Check it too many fields were submitted
  if ( Object.keys(req.body).length > formData.length )
    errors.push('You cannot submit more answers than their are questions!');  
  
  // Check if all required fields are submitted
  formData.forEach(function(element){
    if ( element.required && ( req.body[element.shortName] == null || req.body[element.shortName] == '' ))
      errors.push(postKey+' is a required field. Please fill it in.');
  });
  
  // Checks if all inputs are within range--if it is of type range.
  Object.keys(req.body).forEach(function(postKey) {
    var postVal = req.body[postKey];
    var element = _.find(formData, { 'shortName': postKey })
    
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
  });

  if (errors.length) {
    req.flash('errors', errors);
    return res.redirect('/form/'+cid+'/'+secret);
  }
  
  Cohort.findOne({ _id: cid },function( err, form){
  
    if ( form && form.status == false)      // the form is closed.
      res.redirect('/formClosed');
      
    if ( form && form.secret==secret ){
        req.body.cohort=form._id;
        var application = new Application(req.body);
        application.save(function(err) {
          if (err) {
            console.log(err);
            req.flash('errors', { msg: 'Your form could not be submitted. Please try again later.' });
            res.redirect('/form/'+cid+'/'+secret);
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





