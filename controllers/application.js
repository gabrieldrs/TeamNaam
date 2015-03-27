var Cohort = require('../models/Cohort');
var Application = require('../models/Application');
var _ = require('lodash');
var formLoader = require('./forms');


exports.deleteApplication = function(req, res) {
  Application.remove({ _id: req.body.aid }, function(err){
    if (err) res.status(500).json({ error: 'Application failed to be deleted.' });
    else res.status(200).json({});
  });
}

exports.getStudentDetails = function(req, res) {

}

exports.getMentorDetails = function(req, res) {

}

exports.updateStudentApplication = function(req, res) {

}

exports.updateMentorApplication = function(req, res) {

}


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
      res.render('pages/formDynamic', { student: true, form: formData, title: 'CS Tri-Mentoring Application Form', cohortID: cid, secret: secret, application: {}});
    }else{
      req.flash('errors', { msg: 'Invalid form URL' });
      res.redirect('/404');
    }
  });
};

exports.updateStudentForm = function(req, res) {
  var secret=req.params.secret;
  var cid=req.params.cid;
  var aid=req.params.aid;

  Cohort.findById(cid).lean().exec(function( err, cohort){
    if ( cohort && cohort.status == false)      // the form is closed.
    res.redirect('/formClosed');
    else if ( cohort && cohort.secret==secret ){
      var formData = formLoader.getForm(cohort.form);
      var formData = _.filter( formData, function(formField){ return formField.student!==false; });  // only display the form fields relevant to students
      
      Application.findById(aid).lean().exec(function(err,app){
        if (err){ 
          console.error(err);
          req.flash('errors', { msg: 'Application form data failed to load. Try refreshing?' });
        }
        res.render('pages/formDynamic', { student: true, form: formData, title: 'CS Tri-Mentoring Application Form', cohortID: cid, secret: secret, application: app });
      });
    }else{
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
        if ( element.student!==false && element.required && ( req.body[element.name] == null || req.body[element.name] == '' ))
        errors.push({msg: postKey+' is a required field. Please fill it in.'});
      });

      // Checks if all inputs are within range--if it is of type range.
      Object.keys(req.body).forEach(function(postKey) {
        var postVal = req.body[postKey];
        var element = _.find(formData, { 'name': postKey });

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
            errors.push({msg: postVal+' cannot be lower than '+min+'.'});
            if ( postVal > element.max )
            errors.push({msg: postVal+' cannot be larger than '+max+'.'});
          }
        }
      });


      if (errors.length) {
        console.log("ERRORS:",errors);
        req.flash('errors', errors);
        return res.redirect('/form/student/'+cid+'/'+secret);
      }


      Application.count({ cohort: cid, stdNumber: req.body.stdNumber}).limit(1).count(function( err, count){
        if (count) {
          console.log('An application with the same student number has already been submitted!',err,count);
          req.flash('errors',{msg: 'An application with the same student number has already been submitted!'});
          return res.redirect('/form/student/'+cid+'/'+secret);
        }

        req.body.student=true;
        req.body.cohort=cohort._id;
        var application = new Application(req.body);
        application.save(function(err) {
          if (err) {
            req.flash('errors', {msg: 'Your form could not be submitted. Please try again later.'});
            res.redirect('/form/student/' + cid + '/' + secret);
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


///  POST /form/student/:id/:secret
exports.postUpdateStudentForm = function(req, res) {
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
        if ( element.student!==false && element.required && ( req.body[element.name] == null || req.body[element.name] == '' ))
        errors.push({msg: postKey+' is a required field. Please fill it in.'});
      });

      // Checks if all inputs are within range--if it is of type range.
      Object.keys(req.body).forEach(function(postKey) {
        var postVal = req.body[postKey];
        var element = _.find(formData, { 'name': postKey });

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
            errors.push({msg: postVal+' cannot be lower than '+min+'.'});
            if ( postVal > element.max )
            errors.push({msg: postVal+' cannot be larger than '+max+'.'});
          }
        }
      });


      if (errors.length) {
        console.log("ERRORS:",errors);
        req.flash('errors', errors);
        return res.redirect('/form/update/student/' + cid + '/' + secret+'/'+aid)
      }


        delete req.body._csrf;
        console.log('req.body',req.body);
        
        Application.update({ _id: aid }, { $set: req.body }, function(err) {
          if (err) {
            req.flash('errors', {msg: 'Form could not be updated. Please try again later.'});
            res.redirect('/form/update/student/' + cid + '/' + secret+'/'+aid);
          }
          req.flash('success', {msg: 'Success!  Application updated!'});
          res.redirect('/thankyou');
        });

    }else{
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
      res.render('pages/formDynamic', { student: false, form: mentorForms, title: 'CS Tri-Mentoring Application Form', cohortID: cid, secret: secret, application: {} });
    }
    else{
      req.flash('errors', { msg: 'Invalid form URL' });
      res.redirect('/404');
    }
  });
};




///  POST /form/mentor/:id/:secret
exports.postMentorForm = function(req, res) {
  console.log(req.protocol + '://' + req.get('host') + req.originalUrl);
  var secret=req.params.secret;
  var cid=req.params.cid;
  var errors=[];
  delete req.body._csrf; //delete the CSRF token now because it gets in the way, and isn't needed at the point in the controller.
  Cohort.findById(cid).lean().exec(function( err, cohort){
    if ( cohort && cohort.status == false) {     // the form is closed.
      res.redirect('/formClosed');
    }else if ( cohort && cohort.secret==secret ) {
      var formData = formLoader.getForm(cohort.form);

      // Check it too many fields were submitted
      if ( Object.keys(req.body).length > formData.length )
      errors.push({msg: 'You cannot submit more answers than their are questions!'});

      // Check if all required fields are submitted
      formData.forEach(function(element){
        if ( element.mentor!==false && element.required && ( req.body[element.name] == null || req.body[element.name] == '' )) {
          errors.push({msg: element.name + ' is a required field. Please fill it in.'});

        }
      });

      // Checks if all inputs are within range--if it is of type range.
      Object.keys(req.body).forEach(function(postKey) {
        var postVal = req.body[postKey];
        var element = _.find(formData, { 'name': postKey });

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
            errors.push({msg: postVal+' cannot be lower than '+min+'.'});
            if ( postVal > element.max )
            errors.push({msg: postVal+' cannot be larger than '+max+'.'});
          }
        }
      });

      if (errors.length) {
        console.log("ERRORS:",errors);
        req.flash('errors', errors);
        return res.redirect('/form/mentor/'+cid+'/'+secret);
      }

      Application.count({ cohort: cid, phoneNumber: req.body.phoneNumber}).limit(1).count(function( err, count){
        if (count) {
          console.log('An application with the same phone number has already been submitted!',err,count);
          req.flash('errors',{msg: 'An application with the same phone number has already been submitted!'});
          return res.redirect('/form/mentor/'+cid+'/'+secret);
        }

        req.body.student=false;
        req.body.cohort=cohort._id;
        var application = new Application(req.body);
        application.save(function(err) {
          if (err) {
            console.log(err);
            req.flash('errors', { msg: 'Your form could not be submitted. Please try again later.' });
            res.redirect('/form/mentor/'+cid+'/'+secret);
          }
          req.flash('success', { msg: 'Success!  Application submitted!' });
          res.redirect('/thankyou');
        });

      });

    }else{
      console.log(cohort);
      console.log(cohort.secret == secret);
      req.flash('errors', { msg: 'Invalid form URL' });
      res.redirect('/404');
    }
  });
};


///  POST /form/update/mentor/:id/:secret/:aid
exports.postUpdateMentorForm = function(req, res) {
  console.log(req.protocol + '://' + req.get('host') + req.originalUrl);
  var secret=req.params.secret;
  var cid=req.params.cid;
  var aid=req.params.aid;
  var errors=[];
  
  delete req.body._csrf; //delete the CSRF token now because it gets in the way, and isn't needed at the point in the controller.
  Cohort.findById(cid).lean().exec(function( err, cohort){
    if ( cohort && cohort.secret==secret ) {
      var formData = formLoader.getForm(cohort.form);

      // Check it too many fields were submitted
      if ( Object.keys(req.body).length > formData.length )
      errors.push({msg: 'You cannot submit more answers than their are questions!'});

      // Check if all required fields are submitted
      formData.forEach(function(element){
        if ( element.mentor!==false && element.required && ( req.body[element.name] == null || req.body[element.name] == '' )) {
          errors.push({msg: element.name + ' is a required field. Please fill it in.'});

        }
      });

      // Checks if all inputs are within range--if it is of type range.
      Object.keys(req.body).forEach(function(postKey) {
        var postVal = req.body[postKey];
        var element = _.find(formData, { 'name': postKey });

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
            errors.push({msg: postVal+' cannot be lower than '+min+'.'});
            if ( postVal > element.max )
            errors.push({msg: postVal+' cannot be larger than '+max+'.'});
          }
        }
      });

      if (errors.length) {
        console.log("ERRORS:",errors);
        req.flash('errors', errors);
        return res.redirect('/form/update/mentor/'+cid+'/'+secret+'/'+aid);
      }

        delete req.body._csrf;
        console.log('req.body',req.body);
        
        Application.update({ _id: aid }, { $set: req.body }, function(err) {
          if (err) {
            req.flash('errors', {msg: 'Form could not be updated. Please try again later.'});
            res.redirect('/form/update/mentor/'+cid+'/'+secret+'/'+aid);
          }
          req.flash('success', {msg: 'Success!  Application updated!'});
          res.redirect('/thankyou');
        });

    }else{
      console.log(cohort);
      console.log(cohort.secret == secret);
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
