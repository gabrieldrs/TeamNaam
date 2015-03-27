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
var input = fs.createReadStream('mentorData.csv');
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
    "student": false

*/


function insertToDB(record){
  console.log('record:',record);
  console.log('typeof record:',typeof record);
  console.log('record[9]:',record[9]);
  console.log('test:',record.length);
  var data={
    fname: record[7],
    lname: record[8],
    email: record[9],
    cell: record[10],
    cell2: record[11],
    identity: record[12],
    yearBorn: record[14],
    genderPref: record[15],
    /*comment: record[],*/
    company: record[27],
    position: record[28],
    experience: record[29],
    highestDegree: record[30],
    /*
    availability: record[],
    previousMentor: record[],
    csInterests: record[],
    hobbies: record[],
    */
    student: false  
  }
  
  console.log(JSON.stringify(data,null,4));
  var app = new Application(data);
  app.save(function(err) {  if (err) console.log(err); });
}

