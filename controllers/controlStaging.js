var Application = require('../models/Application');
var Cohort = require('../models/Cohort');
var _ = require('lodash');

// Set a comment to a staging
exports.setStagingComment = function(req, res) {
	var aid=req.params.aid;
	var comment=req.params.value;
	
	Application.findById( aid, function(err, application) {
		if (err){
			console.error(err);
			return res.status(500).json({ aid: aid, comment: comment, error: 'Application comment failed to be updated.' });
		}
		
		application.adminComment = comment;
		console.log(application);
		
		application.save(function(err) {
			if (err){
				console.error(err);
				return res.status(500).json({ aid: aid, comment: application.comment, error: 'Application comment failed to be set.' });
			}
			return res.status(200).json({ aid: aid, comment: application.comment, msg: 'Application comment information updated.' });
		});
	});
};

// Set a tier to a staging
exports.setStagingTier = function(req, res) {
	var aid = req.params.aid;
	var tier = req.params.value;
	if (aid != null) {
		Application.findById(aid, function (err, application) {
			if (err) {
				console.error(err);
				return res.status(500).json({aid: aid, state: tier, error: 'Application tier failed to be updated.'});
			}
			
			application.senior = (tier === 'true');
			application.save(function (err) {
				if (err) {
					console.error(err);
					return res.status(500).json({aid: aid, state: application.senior, error: 'Application tier failed to be set.'});
				}
				return res.status(200).json({aid: aid, state: application.senior, msg: 'Application tier information updated.'});
			});
		});
	}
};

// Set a status to a Staging
exports.setStagingStatus = function(req, res) {
	var aid=req.params.aid;
	var status=req.params.value;
	if (aid != null) {
		Application.findById(aid, function (err, application) {
			if (err || typeof application == 'undefined') {
				console.error(err);
				return res.status(500).json({aid: aid, state: status, error: 'Application status failed to be updated.'});
			}
			
			
			application.accepted = (status === 'true');
			application.save(function (err) {
				if (err) {
					console.error(err);
					return res.status(500).json({
						aid: aid,
						state: application.accepted,
						error: 'Application status failed to be set.'
					});
				}
				console.log("updated", application);
				return res.status(200).json({aid: aid, state: application.accepted, msg: 'Application status updated.'});
			});
		});
	}
};