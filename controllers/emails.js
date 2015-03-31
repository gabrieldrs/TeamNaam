var Cohort = require('../models/Cohort');
var Application = require('../models/Application');
var _ = require('lodash');
var fs = require('fs');
var json2csv = require('json2csv');





///  GET /Emails
exports.getEmails = function(req, res) {
	res.render('pages/emails', {
		title: 'Email List Generation'
	});
};

///  GET /generateEmailsList
exports.postEmailsList = function(req, res) {
	delete req.body._csrf; //delete the CSRF token now because it gets in the way, and isn't needed at the point in the controller.
	if (typeof req.body.applicant_type === 'string')
		var type = [req.body.applicant_type];
	else
		var type = req.body.applicant_type;
	//var state = req.body.applicant_state;
	var query = {};
	var or = [];
	for(var t in type){
		var temp = {}
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