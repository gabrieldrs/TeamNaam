var Cohort = require('../models/Cohort');
var Application = require('../models/Application');
var _ = require('lodash');


//Download CSV file with email lists
exports.postEmailsList = function(req, res) {
	var json2csv = require('json2csv');
	var type;
	delete req.body._csrf; //delete the CSRF token now because it gets in the way, and isn't needed at the point in the controller.
	if (typeof req.body.applicant_type === 'string')
		type = [req.body.applicant_type];
	else
		type = req.body.applicant_type;
	//var state = req.body.applicant_state;
	var query = {};
	var or = [];
	for(var t in type){
		if(type.hasOwnProperty(t)){
			var temp = {};
			if (type[t] == "mentor"){
				temp["student"] = false;
				temp["senior"] = false;
			}else if (type[t] == "junior"){
				temp["student"] = true;
				temp["senior"] = false;
			}else if (type[t] == "senior"){
				temp["student"] = true;
				temp["senior"] = true;
			}
			or[t] = temp;
		}
	}
	if (or.length>0)
		query["$or"] = or;
	//query['matched'] = state=='true'?true:false;
	console.log(" query:", query);
	Application.find(query,function (err,list){
		console.log(list);
		if (err){
			console.error(err);
			req.flash('errors', { msg: 'Failed to generate emails list.' });
			return res.redirect('/Emails');
		}
		json2csv({data: list, fields: ['email']}, function(err, csv) {
			if (err) console.log(err);
			res.setHeader('Content-disposition', 'attachment; filename=emailList.csv');
			res.setHeader('Content-type', 'text/csv');
			res.charset = 'UTF-8';
			res.write(csv);
			res.end();
		});
	});
};

// Generate a matching
exports.setWeights = function(req, res) {
	var algorithm = require('./algorithm');
	var factors=req.body.factors;
	
	Application.find({ cohort: res.locals.activeCohort, accepted: true }).lean().exec(function(err, applications) {
		var matchings = algorithm.calcMatching(applications,factors);  // This is an optional helper function
		res.status(200).json( _.sortBy(matchings, function(n) { return n.quality*(-1); }) ); // Sort Matchings by Qulaity
	});
};



exports.applicationDo = function(req,res){
	var action = req.params.action;
	var type = req.params.type;
	var appController = require("./controlApplication");
	switch(action){
		case "delete":
			appController.deleteApplication(req,res);
			break;
		case "update":
			if (type == 'mentor' || type == 'student') {
				appController.updateApplication(req, res, type);
				break;
			}
		default:
			res.render('404', {title: '404: Page Not Found'});
	}
};




// Post updated Application
exports.postApplicationDo = function(req,res){
	var type = req.params.type;
	var appController = require("./controlApplication");
	if (type == 'mentor' || type == 'student')
		appController.postUpdateApplication(req,res,type)
	else
		res.render('404', {title: '404: Page Not Found'});
};


exports.cohortDo = function(req,res){
	
	var action = req.params.action;
	console.log("something here :D",action);
	var cohort = require("./controlCohort");
	switch(action){
		case "set":
			cohort.setCohort(req,res);
			break;
		case "create":
			cohort.createCohort(req,res);
			break;
		case "update":
			cohort.updateCohort(req,res);
			break;
		case "delete":
			cohort.deleteCohort(req,res);
			break;
		default:
			res.render('404', {title: '404: Page Not Found'});
	}
};


exports.stagingDo = function(req,res){
	var action = req.params.action;
	var staging = require("./controlStaging");
	switch (action){
		case "set_comment":
			staging.setStagingComment(req,res);
			break;
		case "set_tier":
			staging.setStagingTier(req,res);
			break;
		case "set_status":
			staging.setStagingStatus(req,res);
			break;
		default:
			res.render('404', {title: '404: Page Not Found'});
	}
};