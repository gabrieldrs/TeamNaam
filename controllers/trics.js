var Cohort = require('../models/Cohort');
var Application = require('../models/Application');
var _ = require('lodash');



exports.setStagingComment = function(req, res) {
var aid=req.params.aid;
var comment=req.params.comment;

  Application.findById( aid, function(err, application) {
    if (err){ 
      console.error(err);
      return res.status(500).json({ aid: aid, comment: application.comment, error: 'Application comment failed to be updated.' });
    }
    
    application.adminComment = comment;
    console.log(comment);

    application.save(function(err) {
      if (err){
         console.error(err);
         return res.status(500).json({ aid: aid, comment: application.comment, error: 'Application comment failed to be set.' });
      }
      return res.status(200).json({ aid: aid, comment: application.comment, msg: 'Application comment information updated.' });
    });
  });
}


exports.setStagingTier = function(req, res) {
var aid=req.params.aid;
var tier=req.params.tier;

  Application.findById( aid, function(err, application) {
    if (err){ 
      console.error(err);
      return res.status(500).json({ aid: aid, state: application.senior, error: 'Application tier failed to be updated.' });
    }
    
    application.senior = (tier==='true');  // converts boolean string to actual boolean

    application.save(function(err) {
      if (err){
         console.error(err);
         return res.status(500).json({ aid: aid, state: application.senior, error: 'Application tier failed to be set.' });
      }
      return res.status(200).json({ aid: aid, state: application.senior, msg: 'Application tier information updated.' });
    });
  });
}


exports.setStagingStatus = function(req, res) {
var aid=req.params.aid;
var status=req.params.status;

  Application.findById( aid, function(err, application) {
    if (err || typeof application == 'undefined'){ 
      console.error(err);
      return res.status(500).json({ aid: aid, state: application.accepted, error: 'Application status failed to be updated.' });
    }
    
    application.accepted = (status==='true');  // converts boolean string to actual boolean

    application.save(function(err) {
      if (err){
         console.error(err);
         return res.status(500).json({ aid: aid, state: application.accepted, error: 'Application status failed to be set.' });
      }
      return res.status(200).json({ aid: aid, state: application.accepted, msg: 'Application status updated.' });
    });
  });
};



