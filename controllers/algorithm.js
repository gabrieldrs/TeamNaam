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
      
      var mentorAvail = convertToArray(mentor["availability"]);
      var seniorAvail = convertToArray(senior['availability']);
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
    if (student == null)
      return;
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
      var seniorAvail = [].concat(senior["availability"]);
      
      var juniorAvail = [].concat(junior['availability']);
      var commonAvail = [];
      for (var i = 0;i<seniorAvail.length;i++) {
        for (var j = 0; j < juniorAvail.length; j++) {
          if (seniorAvail[i] == juniorAvail[j]) {
            commonAvail.push(seniorAvail[i]);
            break;
          }
        }
      }
      if (commonAvail.length == 0)
        return;
      var quality = calcMatchQuality(senior,junior,factors);
      //console.log(quality);
      thisMatch.push({
        juniorID : junior["_id"],
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
    if (junior == null)
      return;
    var i = _.findIndex(mentorMatch, function(mentor) {
      return mentor['seniorID'] == s['seniorID'];
    });
    mentorMatch[i]['juniorID'] = junior['juniorID'];
    mentorMatch[i]['availability'] = junior['availability'];
    mentorMatch[i]['quality'] = (mentorMatch[i]['quality'] + junior['quality'])/2;
    //console.log(junior['quality']);
  });
  console.log(mentorMatch);
  return mentorMatch;
}

function calcMatchQuality(user1,user2,factors){
  var quality = 0;
  var factorCount = 0;
  factors.forEach(function(e) {
    //console.log(analyzeRefExists(user1,e['name']) +" "+ analyzeRefExists(user2,e['analyzeRef']))
    var firstHalf = calcThisFactor(user1, user2, e);
    var secondHalf = calcThisFactor(user2, user1, e);
    //console.log(secondHalf);
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
  if (factorCount>0)
    return quality/factorCount;
  else
    return 100;
}

function calcThisFactor(user1,user2,factor){
  var thisQuality = 0;
  
  //If there are any undefined analyzeRefs, return -1
  if (!analyzeRefExists(user1,factor['name']) || !analyzeRefExists(user2,factor['analyzeRef']))
    return -1;
  user1[factor['name']] = convertToArray(user1[factor['name']]);
  user2[factor['analyzeRef']] = convertToArray(user2[factor['analyzeRef']]);
  
  user1[factor['name']].forEach(function(v1){
    user2[factor['analyzeRef']].forEach(function(v2){
      if (v1 == v2){
        thisQuality+=factor['weight'];
      }
    });
  });
  thisQuality = (thisQuality/(user2[factor['analyzeRef']].length));
  //console.log(factor['name'] + " quality = "+thisQuality);
  return thisQuality;
}

function analyzeRefExists(user,analyzeRef) {
  return typeof user[analyzeRef] != "undefined";
}

//Convert a string or an array to array
function convertToArray(a){
  //console.log(a)
  if (a instanceof Array) {
    return a;
  }else
    return [a];
}