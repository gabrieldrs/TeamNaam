var Cohort = require('../models/Cohort');
var Application = require('../models/Application');
var _ = require('lodash');


exports.setWeights = function(req, res) {
  
  var factors=req.body.factors;
  var analyzeFactors = []
  factors.forEach(function(f){
    if (f['analyze'] && f['analyze'] == 'true'){
      analyzeFactors.push(f);
    }
  });
  
  Application.find({ cohort: res.locals.activeCohort, accepted: true }).lean().exec(function(err, applications) {
    var matrix = calcMatrix(applications,analyzeFactors);  // This is an optional helper function
    //console.log( JSON.stringify(matrix,null,4) );
    res.status(200).json(matrix);
  });
};


function calcMatrix(applications,factors){
  var juniors = [];
  var seniors = [];
  var mentors = [];
  applications.forEach(function(e){
    if (e['student']){
      if (e['senior'])
        seniors.push(e);
      else
        juniors.push(e);
    }else
      mentors.push(e);
  });
  var mentorMatch = [];
  var nomMatched = [];
  mentors.forEach(function(mentor){
    var thisMatch = [];
    seniors.forEach(function(senior){
      
      var mentorAvail = [].concat(mentor["Availability"]);
      var seniorAvail = [].concat(senior['Availability']);
      var commonAvail = [];
      for (var i = 0;i<mentorAvail.length;i++){
        for (var j=0;j<seniorAvail.length;j++){
          if (mentorAvail[i] == seniorAvail[j]){
            commonAvail.push(mentorAvail[i]);
            break;
          }
        }
      }
      
      if (commonAvail.length == 0)
        return;
      
      var quality = 0;
      factors.forEach(function(factor){
        if (mentor[factor['shortName']] == senior[factor['field']]){
          quality += factor['weight'];
        }
      });
      quality /= factors.length;
      thisMatch.push({
        studentID : senior["_id"],
        quality : quality,
        Availability : commonAvail.toString()
      });
      
    });
    if (thisMatch.length > 0){
      mentorMatch.push({mentorID : mentor["_id"], matches: thisMatch});
    }else {
      nomMatched.push(mentor);
    }
  });
  
  console.log(mentorMatch);
  console.log("\n\n\n");
  console.log(nomMatched);
  
  /*
  return applications.map(function(row) {
        return {
          aid: row._id,   // Each row stores the applicationID (aid) for reference
          matches: applications.map(function(col) {
                return { aid: col._id, score: Math.random() };
             })
             .sort(function(a,b){ 
                return (a.score > b.score); 
             })
        };          
  });
  */
}
