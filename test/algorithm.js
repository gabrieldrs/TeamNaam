var chai = require('chai');
var should = chai.should();
var Algorithm = require('../controllers/algorithm');
var Application = require('../models/Application');

describe('Controllers algorithm', function() {
  it('MatchingValueMentorSenior', function(done) {
    this.timeout(500000);

    var senior = new Application({ // senior student is created here
      fName: 'Harry',
      lName: 'Potter',
      sNumber: '11111111',
      email: 'test@gmail.com',
      gender: "Male",
      preferredGender: "Male",
      availability: ['Monday'],
      student: true,
      senior: true
    });
    var mentor = new Application({ // mentor is created here
      fName: 'Albus',
      lName: 'Dumbledore',
      pNumber: '604-444-4444',
      email: 'testa@gmail.com',
      gender: "Male",
      preferredGender: "Male",
      availability: ['Monday'],
      student: false
    });
    // factors to compare the mentor with senior student
    var factors = [{label: "gender", name: "preferredGender", weight: 75, analyzeRef: "gender"}]; 
    //Find out what is the value of the mentor-senior pair based on factors
    var temp = Algorithm.calcMatchQuality(mentor,senior,factors); 
    // the function for value giving is returned to temp
    if (temp == 75){
      // the test passed, if we are here
      done();
    }

  });

  it('MatchingValueSeniorJunior', function(done) {
  	
    var senior1 = new Application({  // senior student is created here
      fName: 'Hermione',
      lName: 'Granger',
      sNumber: '22222222',
      email: 'testh@gmail.com',
      gender: "Female",
      preferredGender: "Male",
      student: true,
      senior: true
    });
    var junior = new Application({ // junior student is created here
      fName: 'Ginny',
      lName: 'Weasley',
      sNumber: '33333333',
      email: 'testg@gmail.com',
      gender: "Female",
      preferredGender: "Male",
      student: true,
      senior: false
    });
    // factors to compare the senior with junior students
    var factors1 = [{label: "gender", name: "preferredGender", weight: 75, analyzeRef: "gender"}];
    // Find out what is the value of the senior-junior pair based on factors
    var temp2 = Algorithm.calcMatchQuality(senior1,junior,factors1); 
    // the function for value giving is returned to temp2
    if (temp2 == 0){
      // the test passed, if we are here
      done();
    }
  });
});