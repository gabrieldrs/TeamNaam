var fs = require('fs');
var parse = require('csv-parse');
var transform = require('stream-transform');

var Cohort = require('../../models/Cohort');
var Application = require('../../models/Application');
var mongoose = require('mongoose');

var secrets = require('../../config/secrets');
mongoose.connect(secrets.db);

mongoose.connection.on('error', function() {
  console.error('MongoDB Connection Error. Please make sure that MongoDB is running.');
});

var cid;

// We are searching for a cohort to add all these forms to.
Cohort.findOne().sort('-_id').exec(function(err,cohort){
        cid=cohort._id;
        var output = [];
        var parser = parse()
        var input = fs.createReadStream('mentorData.csv');
        var transformer = transform(function(record, callback){

            if (typeof record !== 'undefined')
              insertToDB(record);
            callback(null, record.join(' '));
        }, {parallel: 300});

        input.pipe(parser).pipe(transformer);
});     
        


/* THIS STUFF HERE IS WHAT SHOULD BE EDITED/CUSTOMIZED !!! */  
function insertToDB(record){

    var availability =[];
    if (Math.random()*2|0) availability.push('Monday');
    if (Math.random()*2|0) availability.push('Tuesday');
    if (Math.random()*2|0) availability.push('Wednesday');
    if (Math.random()*2|0) availability.push('Thursday');
    if (Math.random()*2|0) availability.push('Friday');
    
    var previousWorkExperience =[];
      if (Math.random()*2|0) previousWorkExperience.push('Working as an academic');
      if (Math.random()*2|0) previousWorkExperience.push('Working at a startup');
      if (Math.random()*2|0) previousWorkExperience.push('Starting my own business');
      if (Math.random()*2|0) previousWorkExperience.push('Returning to school');
      if (Math.random()*2|0) previousWorkExperience.push('Doing other CS work');
      
     var educationLevel = 'Bachelor';
     if (Math.random()*2|0){
        educationLevel = 'Master';
        if (Math.random()*2|0){
          educationLevel = 'PhD';
          if (Math.random()*2|0){
            educationLevel = 'Other';
          }
        }
     }
     
  var age=new Date();
      age.setFullYear( (record[14] || 1980 ) );
  var data={
    cohort:cid,
    fName: record[7],
    lName: record[8],
    email: record[9],
    phoneNumber: record[10],
    gender: (record[12].indexOf("female") > -1)? 'Female':'Male' ,
    age: age, //record[14],
    genderPref: (record[15].indexOf("female") > -1)? 'Female': (record[15].indexOf("preference") > -1)? ['Male','Female'] :'Male',
    /*comment: record[],*/
    company: record[27],
    position: record[28],
    experience: record[29],
    educationLevel: educationLevel,
    ubcAlumn: (Math.random()*2|0),
    yearsInCS: Math.random()*20|0,
    availability: availability,
    /*
    previousMentor: record[],
    csInterests: record[],
    hobbies: record[],
    */
    student: false,
    accepted: !!(Math.random()*20|0) /* Randomly choose if accepted-heavy bias towards */
  }
  
  console.log(JSON.stringify(data,null,4));
  var app = new Application(data);
  app.save(function(err) {  if (err) console.log(err); });
}
