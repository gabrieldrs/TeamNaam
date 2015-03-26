var Cohort = require('../models/Cohort');
var Application = require('../models/Application');
var _ = require('lodash');

//Array names for Seniors/Juniors
var senGP = "genderPref"; //Gender Preference
var senG = "gender"; //Gender
var senFP = "futurePlans"; //Future plans
var senPrevTri = "prevTriMentoring"; //Previous tri mentoring
var senPrevCoop = "coOp"; //Previous coop
var senAge = "age"; //Age

//Array locations for Mentions
var menGP = "genderPref"; //Gender Preference
var menG = "gender"; //Gender
var menPE = "previousWorkExperience"; //Past work experience
var menYears = "yearsInCS"; //Years in CS
var menAge = "age"; //Mentor age


//TODO for Jonathan: Stuff to delete when done
var request;
exports.buttonFunction = function(req, res) {
  delete req.body._csrf; //delete the CSRF token now because it gets in the way, and isn't needed at the point in the controller.
  request = req;
  request.flash('errors', { msg: 'Working on the alg' });
  console.log("Working on alg");

  //This is to become the body for setWeights

  var factors=req.body.factors;

  Application.find({ cohort: res.locals.activeCohort, accepted: true }).lean().exec(function(err, applications) {
    var matchings = calcTrioMatching(applications,factors);  // This is an optional helper function
    res.status(200).json(matchings);
  });

  //END set weights
  return res.redirect('/Emails');
};
//And don't delete anything beyond this

exports.setWeights = function(req, res) {

  var factors=req.body.factors;

  Application.find({ cohort: res.locals.activeCohort, accepted: true }).lean().exec(function(err, applications) {
    var matchings = calcTrioMatching(applications,factors);  // This is an optional helper function
    res.status(200).json(matchings);
  });
};


function calcTrioMatching(applications,factors){
  console.log("CalcTrio");
  // console.log(applications);
  var juniors = _.where(applications, {student:true,senior:false});
  var seniors = _.where(applications, {student:true,senior:true});
  var mentors = _.where(applications, {student:false});

  var seniorsMentorsMatrix = compareAllSeniorsMentors(seniors,mentors);
  var seniorMentorMatchings = makePairsFromMatrix(seniors, mentors, seniorsMentorsMatrix);

  // console.log("The final pairs were:");
  // for(var i = 0; i < seniorMentorMatchings.length; i++){
  //   console.log("\t" + seniorMentorMatchings[i][0]["fName"] + " : " + seniorMentorMatchings[i][1]["fName"]);
  // }
  var juniorsMatrix = compareAllJuniorsPairs(juniors, seniorMentorMatchings);
  var finalTrio = makeTrioFromMatrix(juniors, seniorMentorMatchings, juniorsMatrix);

  console.log("The final trios were:");
  for(var i = 0; i < finalTrio.length; i++){
    console.log("\t" + finalTrio[i][0]["fName"] + " : " + finalTrio[i][1]["fName"] + " : " + finalTrio[i][2]["fName"]);
  }

  // return finalMatch;
}

function compareSeniorMentor(senior, mentor){
  console.log("Comparing " + senior["fName"] + " and " + mentor["fName"]);
  var matchSuccess = 0;
  //Check the gender preference
  if (senior[senGP] == mentor[menG] && mentor[menGP] == senior[senG])
  matchSuccess += + 1; //1*weightings.get(gender);
  else if (senior[senGP] == mentor[menG] || mentor[menGP] == senior[senG])
  matchSuccess += + .5; //.5*weightings.get(gender);

  //Check if students career plans and mentors career matchup
  //First convert their interests/experiences into arrays
  var studentCareerInterests = convertToArray(senior[senFP]);
  var mentorCareerExperience = convertToArray(mentor[menPE]);
  var similar = 0; //Used to keep track of how many careers the mentor has experience in, where the student is interested
  for (var i = 0; i < studentCareerInterests.length; i++){
    if(_.contains(mentorCareerExperience, studentCareerInterests[i])){ //Check if the mentor has experience in this
      similar++;
    }
  }
  matchSuccess += + ((similar/studentCareerInterests.length));// * weightings.get(experience)); //Gives a relative amount for the student

  // If the student has participated in Tri mentoring, or has coop experience, we should find them an experienced mentor
  //Get the expereinces as a digit
  var triExperience = getTriExperienceAsDigit(senior[senPrevTri]);
  var coopExperience = getCoopExperienceAsDigit(senior[senPrevCoop]);

  if(triExperience >= 1 || coopExperience >= 2){
    if (mentor[menYears] >= 20)
    matchSuccess += + (1);// * weightings.get(maturity)); //The mentor has lots of experience in CS
    else if (mentor[menYears] >= 10)
    matchSuccess += + (.75);// * weightings.get(maturity)); //The mentor has plenty of experience in CS
    else if (mentor[menYears] >= 5)
    matchSuccess += + (.25);// * weightings.get(maturity)); //Its possible the student has more experience than the mentor
  }

  console.log(matchSuccess);

  // Both student and mentor may feel more comfortable if the mentor is older
  if (mentor[menAge] - senior[senAge] >= 20)
  matchSuccess += + (.2);// * weightings.get(maturity)); //The mentor is way older, may not be a good match
  else if (mentor[menAge] - senior[senAge] >= 10)
  matchSuccess += + (.75);// * weightings.get(maturity)); //The mentor is a 'comfortable' amount older
  else if (mentor[menAge] - senior[senAge] >= 5)
  matchSuccess += + (.3);// * weightings.get(maturity)); //The mentor is only a bit older
  else if (mentor[menAge] - senior[senAge] <= -15)
  matchSuccess += + (.05);// * weightings.get(maturity)); //The student is only a bit older
  else if (mentor[menAge] - senior[senAge] <= -5)
  matchSuccess += + (.2);// * weightings.get(maturity)); //The student is way older, likely a poor match
  else
  console.log("1+1 = 7");


  console.log("\n");
  return matchSuccess;

}

function compareJuniorSenior(junior, senior){
  console.log("Comparing " + junior["fName"] + " and " + senior["fName"]);
  var matchSuccess = 0;
  //Check the gender preference
  if (junior[senGP] == senior[senG] && senior[senGP] == junior[senG])
  matchSuccess += + 1; //1*weightings.get(gender);
  else if (junior[senGP] == senior[senG] || senior[senGP] == junior[senG])
  matchSuccess += + .5; //.5*weightings.get(gender);

  //Check if juniors career plans and seniors career plans
  //First convert their interests/experiences into arrays
  var juniorCareerInterests = convertToArray(junior[senFP]);
  var seniorCareerInterests = convertToArray(senior[senFP]);
  var similar = 0; //Used to keep track of how many careers the mentor has experience in, where the student is interested
  for (var i = 0; i < juniorCareerInterests.length; i++){
    if(_.contains(seniorCareerInterests, juniorCareerInterests[i])){ //Check if the mentor has experience in this
      similar++;
    }
  }
  matchSuccess += + ((similar/juniorCareerInterests.length));// * weightings.get(experience)); //Gives a relative amount for the student

  console.log("\n");
  return matchSuccess;
}

function compareJuniorMentor(junior, mentor){
  console.log("Comparing " + junior["fName"] + " and " + mentor["fName"]);
  var matchSuccess = 0;
  //Check the gender preference
  if (junior[senGP] == mentor[menG] && mentor[menGP] == junior[senG])
  matchSuccess += + 1; //1*weightings.get(gender);
  else if (junior[senGP] == mentor[menG] || mentor[menGP] == junior[senG])
  matchSuccess += + .5; //.5*weightings.get(gender);

  //Check if students career plans and mentors career matchup
  //First convert their interests/experiences into arrays
  var studentCareerInterests = convertToArray(junior[senFP]);
  var mentorCareerExperience = convertToArray(mentor[menPE]);
  var similar = 0; //Used to keep track of how many careers the mentor has experience in, where the student is interested
  for (var i = 0; i < studentCareerInterests.length; i++){
    if(_.contains(mentorCareerExperience, studentCareerInterests[i])){ //Check if the mentor has experience in this
      similar++;
    }
  }
  matchSuccess += + ((similar/studentCareerInterests.length));// * weightings.get(experience)); //Gives a relative amount for the student

  // If the student has participated in Tri mentoring, or has coop experience, we should find them an experienced mentor
  //Get the expereinces as a digit
  var triExperience = getTriExperienceAsDigit(junior[senPrevTri]);
  var coopExperience = getCoopExperienceAsDigit(junior[senPrevCoop]);

  if(triExperience >= 1 || coopExperience >= 2){
    if (mentor[menYears] >= 20)
    matchSuccess += + (1);// * weightings.get(maturity)); //The mentor has lots of experience in CS
    else if (mentor[menYears] >= 10)
    matchSuccess += + (.75);// * weightings.get(maturity)); //The mentor has plenty of experience in CS
    else if (mentor[menYears] >= 5)
    matchSuccess += + (.25);// * weightings.get(maturity)); //Its possible the student has more experience than the mentor
  }

  // Both student and mentor may feel more comfortable if the mentor is older
  if (mentor[menAge] - junior[senAge] >= 20)
  matchSuccess += + (.2);// * weightings.get(maturity)); //The mentor is way older, may not be a good match
  else if (mentor[menAge] - junior[senAge] >= 10)
  matchSuccess += + (.75);// * weightings.get(maturity)); //The mentor is a 'comfortable' amount older
  else if (mentor[menAge] - junior[senAge] >= 5)
  matchSuccess += + (.3);// * weightings.get(maturity)); //The mentor is only a bit older
  else if (mentor[menAge] - junior[senAge] <= -15)
  matchSuccess += + (.05);// * weightings.get(maturity)); //The student is only a bit older
  else if (mentor[menAge] - junior[senAge] <= -5)
  matchSuccess += + (.2);// * weightings.get(maturity)); //The student is way older, likely a poor match
  else
  console.log("1+1 = 7");

  console.log("\n");
  return matchSuccess;
}

//Used to create the matrix for juniors and pairs
function compareAllJuniorsPairs(juniors, pairs){
  //At this point we have paried seniors and mentors up (creating our pair)
  //Each pair is an array with the senior first and the mentor second
  console.log("Comparing all juniors and pairs");
  var matrix = new Array(juniors.length); //We are going to create a 2d matrix in two parts. It will be matrix[junior][pair]
  if (juniors.length < 1 || pairs.length < 1){
    console.log("Empty list");
    return {};
  };

  for(var j = 0; j < juniors.length; j++){
    matrix[j] = new Array(pairs.length); //Part two of the 2d matrix
    for(var p = 0; p < pairs.length; p++){
      var senior = pairs[p][0];
      var mentor = pairs[p][1];

      var seniorAvail = convertToArray(senior["availability"]);
      var mentorAvail = convertToArray(mentor['availability']);
      var juniorAvail = convertToArray(juniors[j]['availability']);
      var pairCommonAvail = _.intersection(seniorAvail,mentorAvail); //Nights that the seniors/mentors share
      var commonAvail = _.intersection(juniorAvail,pairCommonAvail);

      if (commonAvail.length == 0)
      return; //They have no nights in common, they can't be paired
      var junSenQuality = compareJuniorSenior(juniors[j], senior); //Calculate the match success of these two applicants
      var junMenQuality = compareJuniorMentor(juniors[j], mentor); //Calculate the match success of these two applicants

      matrix[j][p] = junSenQuality + junMenQuality;
    }
  }
  console.log(matrix);
  return matrix;
}


//Used to create the matrix for seniors and mentors
function compareAllSeniorsMentors(seniors, mentors){
  console.log("Comparing all seniors and mentors");
  var matrix = new Array(seniors.length); //We are going to create a 2d matrix in two parts. It will be matrix[senior][mentor]
  if (seniors.length < 1 || mentors.length < 1){
    console.log("Empty list");
    return {};
  };

  for(var s = 0; s < seniors.length; s++){
    matrix[s] = new Array(mentors.length); //Part two of the 2d matrix
    for(var m = 0; m < mentors.length; m++){
      var seniorAvail = convertToArray(seniors[s]["availability"]); //The first groups availability
      var mentorAvail = convertToArray(mentors[m]['availability']); //The second groups availability
      var commonAvail = _.intersection(seniorAvail,mentorAvail); //Nights that both applicants share

      if (commonAvail.length == 0)
      return; //They have no nights in common, they can't be paired
      var quality = compareSeniorMentor(seniors[s],mentors[m]); //Calculate the match success of these two applicants
      matrix[s][m] = quality;
    }
  }
  console.log("The senior/mentor matrix is: ");
  console.log(matrix);
  return matrix;
}

//Convert a string or an array to array
function convertToArray(a){
  if (a instanceof Array) {
    return a;
  }else
  return [a];
}

//This function is used to return an integer represesnting the students experience in TriMentoring
//0 = None, 1 = As a junior, 2 = As a senior, 3 = Both
function getTriExperienceAsDigit(experience){
  var triOptions = ["None","As a junior","As a senior", "Both"];
  for (var i = 0; i < triOptions.length; i++){
    if(triOptions[i] == experience){
      return i;
    }
  }
}

//This function is used to return an integer represesnting the students experience in Coop
//0 = None, 1 = none but interested , 2 = in coop, 3 = done
function getCoopExperienceAsDigit(experience){
  var triOptions = ["None, and not interested","None, but I am interested","Currently in CoOp", "Completed CoOp"];
  for (var i = 0; i < triOptions.length; i++){
    if(triOptions[i] == experience){
      return i;
    }
  }
}

//This function finds the highest score in the matrix and returns the index of that score
//Returns [studentIndex, mentorIndex] of the next highest score
function makePairsHelper(matrix){
  //console.log("\t\tAnalyzing matrix");
  //The matrix is ordered as matrix[students][mentors]
  var sLength = matrix.length; //The students are stored in the first dimension of the matrix
  var mLength = matrix[0].length; //The mentors are stored in the second dimension of the matrix
  //console.log("\t\tHelper: sL=" + sLength + ", mL=" + mLength);
  //console.log("\t\t" + matrix);
  //Used to keep track of the highest score and where it is
  var currentHighest = 0;
  var sIndex = 0;
  var mIndex = 0;

  for(var s = 0; s < sLength; s++){
    //console.log("\t\t" + matrix[s]);
    for(var m = 0; m < mLength; m++){
      if(matrix[s][m] > currentHighest){
        currentHighest = matrix[s][m];
        sIndex = s;
        mIndex = m;
      }
    }
  }

  return [sIndex, mIndex];
}


//We now have a matrix and want to choose the pairs we want.
//To do this, we will pick the highest score from the table, add the respective student and mentor to the pairs array
//and delete that student and mentor (row and column) from the table and recurse.
//Returns an array of the matchedPairs. Each pair is stored as [student, mentor]
function makePairsFromMatrix(allStudents, allMentors, fullMatrix){
  console.log("\nStaring to make pairs");
  //Copy the studetns, mentors, matrix
  var students = allStudents;
  var mentors = allMentors;
  var matrix = fullMatrix;
  var originalStudentsLength = students.length;
  //Set up the empty array for the new matches
  var matchedPairs = new Array(students.length);

  for(var i = 0; i < originalStudentsLength; i++){
    console.log("\tIteration: " + i);
    var nextBestIndex = makePairsHelper(matrix); //Returns an array of the index of next highest score. Of the form [student, mentor]
    var bestStudentIndex = nextBestIndex[0];
    var bestMentorIndex = nextBestIndex[1];
    matchedPairs[i] = [students[bestStudentIndex], mentors[bestMentorIndex]]; //Save the pair into the matchedPair array
    console.log("\tMatched Pair: " + students[bestStudentIndex]["fName"] + " : " + mentors[bestMentorIndex]["fName"]);
    //We now have to remove both the student and mentor from the matrix. Recall that the matrix was created by making an element for each student, and in each element making an array for the mentors
    //So first we have to remove the mentor from every student in the matrix
    for(var k = 0; k < students.length; k++){
      matrix[k].splice(bestMentorIndex, 1);
    }
    //Now delete the student from the matrix
    matrix.splice(bestStudentIndex, 1);

    //Now lets remove the actual student and mentor
    students.splice(bestStudentIndex, 1);
    mentors.splice(bestMentorIndex, 1);
    console.log("\n");
  }

  return matchedPairs;
}

//Returns an array of the matchedPairs. Each pair is stored as [junior, senior, mentor]
function makeTrioFromMatrix(allJuniors, allPairs, fullMatrix){
  console.log("\nStaring to make pairs");
  //Copy the studetns, mentors, matrix
  var juniors = allJuniors;
  var pairs = allPairs;
  var matrix = fullMatrix;
  var originalStudentsLength = juniors.length;
  //Set up the empty array for the new matches
  var matchedPairs = new Array(juniors.length);

  for(var i = 0; i < originalStudentsLength; i++){
    console.log("\tIteration: " + i);
    var nextBestIndex = makePairsHelper(matrix); //Returns an array of the index of next highest score. Of the form [student, mentor]
    var bestJuniorIndex = nextBestIndex[0];
    var bestPairsIndex = nextBestIndex[1];
    matchedPairs[i] = [juniors[bestJuniorIndex], pairs[bestPairsIndex][0], pairs[bestPairsIndex][1]]; //Save the pair into the matchedPair array
    console.log("\tMatched Pair: " + juniors[bestJuniorIndex]["fName"] + " : " + pairs[bestPairsIndex][0]["fName"] + " : " + pairs[bestPairsIndex][1]["fName"]);
    //We now have to remove both the student and mentor from the matrix. Recall that the matrix was created by making an element for each student, and in each element making an array for the mentors
    //So first we have to remove the mentor from every student in the matrix
    for(var k = 0; k < juniors.length; k++){
      matrix[k].splice(bestPairsIndex, 1);
    }
    //Now delete the student from the matrix
    matrix.splice(bestJuniorIndex, 1);

    //Now lets remove the actual student and mentor
    juniors.splice(bestJuniorIndex, 1);
    pairs.splice(bestPairsIndex, 1);
    console.log("\n");
  }

  return matchedPairs;
}
