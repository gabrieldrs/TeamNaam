var fs = require('fs');
var parse = require('csv-parse');
var transform = require('stream-transform');

var Application = require('../../models/Application');
var mongoose = require('mongoose');

var secrets = require('../../config/secrets');
mongoose.connect(secrets.db);

mongoose.connection.on('error', function() {
  console.error('MongoDB Connection Error. Please make sure that MongoDB is running.');
});


var output = [];
var parser = parse()
var input = fs.createReadStream('studentData.csv');
var transformer = transform(function(record, callback){

    if (typeof record !== 'undefined')
      insertToDB(record);
    callback(null, record.join(' '));
}, {parallel: 300});

input.pipe(parser).pipe(transformer);

/*
    "fname": "Yong Yan",
    "lname": "Gang",
    "email": "Gang.Yong Yan+AEA-smile.dm",
    "cell": "250+AC0-6670269",
    "cell2": "",
    "identity": "Identify as female",
    "yearBorn": "",
    "genderPref": 1987,
    "company": "3+AC0-5 years",
    "position": "Bachelor's",
    "experience": "Bachelor's",
    "highestDegree": "",
    "student": true

*/


function insertToDB(record){
  console.log('record:',record);
  console.log('typeof record:',typeof record);
  console.log('record[9]:',record[9]);
  console.log('test:',record.length);
  var data={
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

