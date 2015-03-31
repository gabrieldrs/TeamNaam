var Cohort = require('../models/Cohort');
var Application = require('../models/Application');
var _ = require('lodash');
var formLoader = require('./forms');
//var URL = require('url');




///  GET /set_cohort/:cid           <-- USED on the top navbar to determine which is the active cohort.
exports.setCohort = function(req, res) {
  req.session.activeCohort=req.params.cid;
  res.redirect('/');
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

///  GET /cohort/

exports.cohort = function(req, res) {

  Cohort.findById(res.locals.activeCohort, function (err, c) {
      if (err){
        console.error(err);
        req.flash('errors', { msg: err });
        res.redirect('/500');
      }
      Application.count({cohort: res.locals.activeCohort }).limit(1).count(function( err, count){

        console.log(count, (count));
        if (count)    // IF there are any submitted applications, we lock the questionaire used.
          c.formLock = true;
        else
          c.formLock = false;

        c.save(function(err) {
            if (err){
              console.error(err);
              req.flash('errors', { msg: err });
            }

            var formNames = formLoader.getAllFormNames();
            /*console.log();
            var parts = URL.parse(req.url, true);
            var hostName = parts['host'];*/
            res.render('pages/cohort', {
              title: 'Cohort Settings',
              forms: formNames,
              cohort: c,/* This overrides the cohort field set as middleware in app.js.  If we don't do this the cohort object rendered on the page will not show the lock for one more page load */
              host: req.get('host')
            });
        });

      });
  });
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
    cohort.secret = req.body.secret || '';

    if (cohort.formLock == false){
      cohort.form = req.body.form || "form default";
    }


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
  Cohort.find().count(function( err, count){
    if(count==1){
      req.flash('errors', {msg: "You can't delete the last cohort!"});
      res.redirect('/Cohort');
    }else{
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
    }
  });

};
