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
  
  var data={
    cohort:cid,
    fname: record[6],
    lname: record[7],
    email: record[8],
    studentNumber: record[9],
    cell: record[10],
    cell2: record[11],
    identity: record[12],
    yearBorn: record[13],
    genderPref: record[18],
    degree: record[19],
    availabilityComment: record[20],
    year: record[22],
    previousMentee: record[24],
    coop: record[25],
    csInterests: record[35],
    /*
    availability: record[],
    
    
    hobbies: record[],
    */
    student: true
  }
  
  console.log(JSON.stringify(data,null,4));
  var app = new Application(data);
  app.save(function(err) {  if (err) console.log(err); });
}
