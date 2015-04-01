var Application = require('../models/Application');
var Cohort = require('../models/Cohort');
var _ = require('lodash');

// Set the active Cohort
exports.setCohort = function(req, res) {
	req.session.activeCohort=req.params.cid;
	res.redirect('/');
};

///  Create a new Cohort
exports.createCohort = function(req, res) {
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

// Update the Cohort
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

// Delete the Cohort
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