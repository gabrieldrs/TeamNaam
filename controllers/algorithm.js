var Cohort = require('../models/Cohort');
var Application = require('../models/Application');
var _ = require('lodash');


exports.setWeights = function(req, res) {
  
  var factors=req.body.factors;
  
  Application.find({ cohort: res.locals.activeCohort, accepted: true }).lean().exec(function(err, applications) {
    var matchings = calcMatching(applications,factors);  // This is an optional helper function
    //console.log( JSON.stringify(matchings,null,4) );
    res.status(200).json(matchings);
  });
};


function calcMatching(applications,factors){
  var juniors = _.where(applications, {student:true,senior:false});
  var seniors = _.where(applications, {student:true,senior:true});
  var mentors = _.where(applications, {student:false});
  var mentorMatch = []; //This array will hold the final match between mentor and senior students
  
  var tempMentorMatch = [];
  var tempSeniorMatch = [];
  mentors.forEach(function(mentor){
    var thisMatch = [];
    seniors.forEach(function(senior){
      
      var mentorAvail = convertToArray(mentor["Availability"]);
      var seniorAvail = convertToArray(senior['Availability']);
      var commonAvail = _.intersection(mentorAvail,seniorAvail);
      
      if (commonAvail.length == 0)
        return;
      var quality = calcMatchQuality(mentor,senior,factors);
      thisMatch.push({
        seniorID : senior["_id"],
        quality : quality,
        availability : commonAvail
      });
      
    });
    if (thisMatch.length > 0){
      tempMentorMatch.push({mentorID : mentor["_id"], matches: thisMatch});
      //console.log(thisMatch);
    }
  });
  
  tempMentorMatch.forEach(function(m){
    var bestQuality = -1;
    var student = null;
    m['matches'].forEach(function(s){
      if (s['quality']>bestQuality){
        bestQuality = s['quality'];
        student = s;
      }
    });
    mentorMatch.push({
      mentorID : m['mentorID'],
      seniorID : student['seniorID'],
      quality : student['quality'],
      availability : student['availability']
    });
  });
  
  mentorMatch.forEach(function(match){
    var senior=_.where(seniors, {_id: match['seniorID']})[0];
    //console.log(senior);
    senior["Availability"] = match['availability']; // overwriting it's availability, so it matches with mentor's ones.
    
    var thisMatch = [];
    juniors.forEach(function(junior){
      var seniorAvail = [].concat(senior["Availability"]);
      var juniorAvail = [].concat(junior['Availability']);
      var commonAvail = [];
      for (var i = 0;i<seniorAvail.length;i++){
        for (var j=0;j<juniorAvail.length;j++){
          if (seniorAvail[i] == juniorAvail[j]){
            commonAvail.push(seniorAvail[i]);
            break;
          }
        }
      }
      if (commonAvail.length == 0)
        return;
      var quality = calcMatchQuality(senior,junior,factors);
      thisMatch.push({
        seniorID : senior["_id"],
        quality : quality,
        availability : commonAvail.toString()
      });
    });
    if (thisMatch.length > 0){
      tempSeniorMatch.push({seniorID : senior["_id"], matches: thisMatch});
      //console.log(thisMatch);
    }
  });
  
  tempSeniorMatch.forEach(function(s){
    var bestQuality = -1;
    var junior = null;
    s['matches'].forEach(function(j){
      if (j['quality']>bestQuality){
        bestQuality = j['quality'];
        junior = j;
      }
    });
    
    var i = _.findIndex(mentorMatch, function(mentor) {
      return mentor['seniorID'] == s['seniorID'];
    });
    mentorMatch[i]['juniorID'] = junior['seniorID'];
    mentorMatch[i]['availability'] = junior['availability'];
    mentorMatch[i]['quality'] = (mentorMatch[i]['quality'] + junior['quality'])/2;
    //console.log(junior['quality']);
  });

  return mentorMatch;
}

function calcMatchQuality(user1,user2,factors){
  var quality = 0;
  var factorCount = 0;
  factors.forEach(function(e) {
    var firstHalf = calcThisFactor(user1, user2, e);
    var secondHalf = calcThisFactor(user2, user1, e);
    if (firstHalf != -1)
      factorCount++;
    else
      firstHalf = 0;
    
    if (secondHalf != -1)
      factorCount++;
    else
      secondHalf = 0;
    
    quality += (firstHalf+secondHalf);
  });
  return quality/factorCount;
}

function calcThisFactor(user1,user2,factor){
  var thisQuality = 0;
  //If there are any undefined fields, return -1
  if (!fieldExists(user1,factor['shortName']) || !fieldExists(user2,factor['field']))
    return -1;
  user1[factor['shortName']] = convertToArray(user1[factor['shortName']]);
  user2[factor['field']] = convertToArray(user2[factor['field']]);
  
  user1[factor['shortName']].forEach(function(v1){
    user2[factor['field']].forEach(function(v2){
      if (v1 == v2){
        thisQuality+=factor['weight'];
      }
    });
  });
  thisQuality = (thisQuality/(user2[factor['field']].length));
  //console.log(factor['shortName'] + " quality = "+thisQuality);
  return thisQuality;
}

function fieldExists(user,field) {
  return typeof user[field] != "undefined";
}

//Convert a string or an array to array
function convertToArray(a){
  //console.log(a)
  if (a instanceof Array) {
    return a;
  }else
    return [a];
}