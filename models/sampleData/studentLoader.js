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
        var input = fs.createReadStream('studentData.csv');
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
    
    var age=new Date();
        age.setFullYear( (record[13] || 1994) );
  var data={
    cohort:cid,
    fName: record[6],
    lName: record[7],
    email: record[8],
    studentNo: record[9],
    /*cell: record[10],
    cell2: record[11],*/
    gender: (record[12].indexOf("female") > -1)? 'Female':'Male' ,
    age: age,   // makes a date object given only Year- but we make this year since its passed in a sentence.
    genderPref: record[18],
    program: record[19],
    availability: availability,
    availabilityComment: record[20],
    year: 1+Math.random()*4.1|0,
    prevTriMentoring: 'None', //record[24],
    coOp: ['Completed CoOp'],    //record[25],
    csInterests: record[35],
    
    futurePlans: ["Working at a startup","Working as an academic"],
    /*
    availability: record[],
    
    
    hobbies: record[],
    */
    student: true,
    senior: !!(Math.random()*2|0),  /* Randomly choose between Junior & Senior */
    accepted: !!(Math.random()*20|0) /* Randomly choose if accepted-heavy bias towards accepted */
  }
  
  console.log(JSON.stringify(data,null,4));
  var app = new Application(data);
  app.save(function(err) {  if (err) console.log(err); });
}
