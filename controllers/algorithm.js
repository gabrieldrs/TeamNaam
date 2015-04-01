var Cohort = require('../models/Cohort');
var Application = require('../models/Application');
var _ = require('lodash');
var Matrix = require('./hungarianAlgorithm');

/*
exports.setWeights = function(req, res) {

  var factors=req.body.factors;

  Application.find({ cohort: res.locals.activeCohort, accepted: true }).lean().exec(function(err, applications) {
    var matchings = calcMatching(applications,factors);  // This is an optional helper function
    res.status(200).json( _.sortBy(matchings, function(n) { return n.quality*(-1); }) ); // Sort Matchings by Qulaity
  });
};
*/


exports.calcMatching = function(applications,factors){
  var juniors = _.where(applications, {student:true,senior:false});
  var seniors = _.where(applications, {student:true,senior:true});
  var mentors = _.where(applications, {student:false});

  var mentorMatrix = generateMatrix(mentors,seniors,factors);
  //console.log(mentorMatrix);
  if (mentorMatrix == null)
    return {};
  var mentorsAndSeniors = Matrix.run.hungarianAlgortithm(mentorMatrix); // got an array with tuples [mentor,senior,quality] 
                                                                        // that refers to their positions in their respective
                                                                        // arrays
  //console.log(mentorsAndSeniors);
  var matchedSeniors = [];
  for (var i = 0; i<mentorsAndSeniors.length;i++){
    var thisMentor = mentors[mentorsAndSeniors[i][0]];
    var thisSenior = seniors[mentorsAndSeniors[i][1]];
    if (thisMentor == undefined || thisSenior == undefined)
      continue;
    
    matchedSeniors.push(seniors[mentorsAndSeniors[i][1]]); //Add this senior student to the list of matched seniors
    
    var mentorAvail = convertToArray(thisMentor["availability"]); 
    var seniorAvail = convertToArray(thisSenior['availability']); 
    var commonAvail = _.intersection(mentorAvail,seniorAvail); 
    
    matchedSeniors[matchedSeniors.length-1]['availability'] = commonAvail;  // change it's availability to be the common 
                                                                            // availability between them and their mentor
  }
  
  
  var seniorMatrix = generateMatrix(matchedSeniors,juniors,factors);  
  if (seniorMatrix == null)
    return {};
  var seniorsAndJuniors = Matrix.run.hungarianAlgortithm(seniorMatrix);   // got an array with pairs [senior,junior,quality] 
                                                                          // that refers their positions in their 
                                                                          // respective arrays
  
  var finalMatch = [];
  for (var i = 0; i<mentorsAndSeniors.length;i++){
    var thisMentor = mentors[mentorsAndSeniors[i][0]];
    var thisSenior = seniors[mentorsAndSeniors[i][1]];
    var thisJunior = undefined;
    var quality = mentorsAndSeniors[i][2];
    
    if (thisMentor == undefined || thisSenior == undefined)
      continue;
    
    for (var j=0;j<seniorsAndJuniors.length;j++){
      var senior = seniors[seniorsAndJuniors[j][0]];
      if (senior['_id'] == thisSenior['_id']) {
        thisJunior = juniors[seniorsAndJuniors[j][1]];
        quality += seniorsAndJuniors[j][2]
        quality /= 2;
        break;
      }
    }
    if (thisJunior == undefined)
      continue;
    
    finalMatch.push({
      mentor : thisMentor,
      senior : thisSenior,
      junior : thisJunior,
      quality : Number(quality).toFixed(0).toString()+"%"
    });
  }

  console.log(finalMatch);
  return finalMatch;
}

function generateMatrix(groupOne,groupTwo,factors){
  if (groupOne.length < 1 || groupTwo.length < 1)
    return null;

  var matrix_length = _.max([groupOne.length,groupTwo.length]);
  var matrix = createNewMatrix(matrix_length);
  
  for (var i = 0;i<matrix_length;i++){
    for (var j = 0;j<matrix_length;j++){
      if (groupOne[i] != undefined && groupTwo[j] != undefined)
        matrix[i][j] = calcMatchQuality(groupOne[i],groupTwo[j],factors);
    }
  }
  //console.log(matrix);
  return matrix;
}

function calcMatchQuality(user1,user2,factors){
  var quality = 0;
  var factorLength = factors.length;
  var factorSum = 0;
  
  
  var appOneAvail = convertToArray(user1["availability"]); //The first groups availability
  var appTwoAvail = convertToArray(user2['availability']); //The second groups availability
  var commonAvail = _.intersection(appOneAvail,appTwoAvail); //Nights that both applicants share
  
  //if (commonAvail.length == 0)
  //  return quality; //They have no nights in common, the match quality is 0
  
  factors.forEach(function(e) {
    var firstHalf = calcThisFactor(user1, user2, e);
    var secondHalf = calcThisFactor(user2, user1, e);
    if (firstHalf == -1 && secondHalf == -1) {
      factorLength--;
      return;
    }
    factorSum+= Number(e.weight);
    quality += (firstHalf+secondHalf);
    if ((firstHalf != -1 && secondHalf != -1))
      quality /= 2;
  });
  
  if (factorSum > 0) {
    quality /= factorSum;
    quality *= 100;
  }
  console.log("quality:"+quality);
  console.log("factorSum:"+factorSum);
  return quality;
}

function calcThisFactor(user1,user2,factor){
  var thisQuality = 0;
  //if (factor['name'] != "availability") return -1; //Just for testing purposes
  //If there are any undefined analyzeRefs, return -1


  if (!analyzeRefExists(user1,factor['name']) || !analyzeRefExists(user2,factor['analyzeRef']))
    return -1;

   /* if (factor['name'] == "futurePlans"){
        console.log("User 1 array: "+user1[factor['name']]);
        console.log("User 2 array: "+user2[factor['analyzeRef']]);

        console.log("quality: "+thisQuality);
        console.log("length: "+user2[factor['analyzeRef']].length);

    }*/ //Just for testing purposes
  user1[factor['name']] = convertToArray(user1[factor['name']]);
  user2[factor['analyzeRef']] = convertToArray(user2[factor['analyzeRef']]);

  user1[factor['name']].forEach(function(v1){
    user2[factor['analyzeRef']].forEach(function(v2){
      if (factor['type'] == 'number'){
        if ((Number(v1) > Number(v2) && Number(v1) < (Number(v2)+10)) || (Number(v1) < Number(v2) && Number(v1) > (Number(v2)-10))){
          thisQuality+=Number(factor['weight']);
        }
      }else if (v1 == v2){
        thisQuality+=Number(factor['weight']);
      }
    });
  });
    //console.log("quality: "+thisQuality);
  /*console.log("User 1 array: "+user1[factor['name']]);
  console.log("User 2 array: "+user2[factor['analyzeRef']]);

  console.log("quality: "+thisQuality);
  console.log("length: "+user2[factor['analyzeRef']].length)*/

  //thisQuality = (thisQuality/(user2[factor['analyzeRef']].length));
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


function createNewMatrix(matrix_length){
  var result = new Array(matrix_length);
  
  for (var i = 0;i < result.length;i++){
    result[i] = new Array(matrix_length);
    for (var j = 0; j< result[i].length;j++){
      result[i][j] = 0;
    }
  }
  return result;
}
