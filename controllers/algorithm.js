var Cohort = require('../models/Cohort');
var Application = require('../models/Application');
var _ = require('lodash');


exports.setWeights = function(req, res) {

  var factors=req.body.factors;

  Application.find({ cohort: res.locals.activeCohort, accepted: true }).lean().exec(function(err, applications) {
    var matchings = calcTrioMatching(applications,factors);  // This is an optional helper function
    res.status(200).json(matchings);
  });
};


function calcTrioMatching(applications,factors){
  var juniors = _.where(applications, {student:true,senior:false});
  var seniors = _.where(applications, {student:true,senior:true});
  var mentors = _.where(applications, {student:false});

  var mentorMatch = calcDuoMatching(mentors,seniors,factors);
  var finalMatch = calcDuoMatching(seniors,juniors,factors,mentorMatch); 
  
  // TODO:  its probably better form to seperate the finalMatch() function, into another function like stich(mentorMatch,studentMatch) instead of an optional parameter

  console.log(finalMatch);
  return finalMatch;
}


function calcDuoMatching(groupOne,groupTwo,factors,currentMatch){
  //console.log(currentMatch);
  if (currentMatch == undefined){
    return calcDuoMatching2(groupOne,groupTwo,factors);
  }

  if (groupOne.length < 1 || groupTwo.length < 1)
    return currentMatch;
  var groupOneName =  getGroupName(groupOne[0]);
  var groupTwoName =  getGroupName(groupTwo[0]);
  currentMatch.forEach(function(match){
    var i = _.findIndex(groupOne, function(appOne){
      return appOne['_id'] == match[groupOneName+'ID'];
    });
    groupOne[i]["availability"] = match['availability']; // overwriting it's availability, so it matches with the currentMatch's ones.
  });

  var groupOneMatch = calcDuoMatching(groupOne,groupTwo,factors);

  currentMatch.forEach(function(match){
    var i = _.findIndex(groupOneMatch, function(appOne){
      return appOne[groupOneName+'ID'] == match[groupOneName+'ID'];
    });
    match[groupTwoName+'ID'] = groupOneMatch[i][groupTwoName+'ID'];
    match['quality'] = (match['quality'] + groupOneMatch[i]['quality'])/2;
    match["availability"] = _.intersection(match['availability'],groupOneMatch[i]['availability']);
  });

  return currentMatch;

}

function calcDuoMatching2(groupOne,groupTwo,factors){
  if (groupOne.length < 1 || groupTwo.length < 1)
    return {};
  var appOneMatch = [];
  var tempAppOneMatch = [];

  // These are used to label the JSON fields
  var groupOneName = getGroupName(groupOne[0]);
  var groupTwoName = getGroupName(groupTwo[0]);

  groupOne.forEach(function(appOne){ //Cycle through the first group (mentors, then seniors)
    var thisMatch = [];
    groupTwo.forEach(function(appTwo){ //Cycle through the second group (seniors, juniors)

      var appOneAvail = convertToArray(appOne["availability"]); //The first groups availability
      var appTwoAvail = convertToArray(appTwo['availability']); //The second groups availability
      var commonAvail = _.intersection(appOneAvail,appTwoAvail); //Nights that both applicants share

      if (commonAvail.length == 0)
        return; //They have no nights in common, they can't be paired
      var quality = calcMatchQuality(appOne,appTwo,factors); //Calculate the match success of these two applicants
      var thisMatchEntry = JSON.parse("{"+
      '"'+groupTwoName+'ID" : "'+appTwo['_id']+'",'+
      '"quality" : '+quality+","+
      '"availability" : []'+
      "}")
      thisMatchEntry['availability'] = commonAvail;
      thisMatch.push(thisMatchEntry);

    });
    if (thisMatch.length > 0){
      //console.log(thisMatch);
      var tempMatchEntry = JSON.parse('{"'+groupOneName+'ID" : "'+appOne['_id']+'", "matches" : []}');
      tempMatchEntry['matches'] = thisMatch;
      tempAppOneMatch.push(tempMatchEntry);
    }
  });
  tempAppOneMatch.forEach(function(appOne){
    var bestQuality = -1;
    var bestMatch = null;
    appOne['matches'].forEach(function(appTwo){
      if (appTwo['quality']>bestQuality){
        bestQuality = appTwo['quality'];
        bestMatch = appTwo;
      }
    });
    if (bestMatch == null)
      return;
    var matchEntry = JSON.parse("{"+
    '"'+groupOneName+'ID" : "'+appOne[groupOneName+'ID']+'",'+
    '"'+groupTwoName+'ID" : "'+bestMatch[groupTwoName+'ID']+'",'+
    '"quality" : '+bestMatch['quality']+","+
    '"availability" : []'+
    "}")
    matchEntry['availability'] = bestMatch['availability']
    appOneMatch.push(matchEntry);
  });

  return appOneMatch;
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
  if (a instanceof Array) {
    return a;
  }else
    return [a];
}


function getGroupName(applicant){
  if (applicant.student)
    if (applicant.senior)
      return "senior";
    else
      return "junior";
  else
    return "mentor";
}
