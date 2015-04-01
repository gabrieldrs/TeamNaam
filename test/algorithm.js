var chai = require('chai');
var should = chai.should();
var Algorithm = require('../controllers/algorithm');
var Application = require('../models/Application');

describe('Controllers algorithm', function() {
  it('MatchingValueMentorSenior', function(done) {
    this.timeout(500000);
    //var user = new User({
    //  email: 'test@gmail.com',
    //  password: 'password'
    //});
    //user.save(function(err) {
    //  if (err) return done(err);
    //  done();
    // create a mentor and a senior and run the algorithm to find the value
    //
    //})
    var senior = new Application({
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
    var mentor = new Application({
      fName: 'Albus',
      lName: 'Dumbledore',
      pNumber: '604-444-4444',
      email: 'testa@gmail.com',
      gender: "Male",
      preferredGender: "Male",
      availability: ['Monday'],
      student: false
    });
    var factors = [{label: "gender", name: "preferredGender", weight: 75, analyzeRef: "gender"}];//needs to be defined
    //Find out what is the value of the mentor-senior pair
    var temp = Algorithm.calcMatchQuality(mentor,senior,factors);
    if (temp == 75){
      done();
    }

  });

  it('MatchingValueSeniorJunior', function(done) {
   // var user = new User({
    //  email: 'test@gmail.com',
    //  password: 'password'
    //});
    //user.save(function(err) {
    //  if (err) err.code.should.equal(11000);
    //  done();
    //});
  	
    var senior1 = new Application({
      fName: 'Hermione',
      lName: 'Granger',
      sNumber: '22222222',
      email: 'testh@gmail.com',
      gender: "Female",
      preferredGender: "Male",
      student: true,
      senior: true
    });
    var junior = new Application({
      fName: 'Ginny',
      lName: 'Weasley',
      sNumber: '33333333',
      email: 'testg@gmail.com',
      gender: "Female",
      preferredGender: "Male",
      student: true,
      senior: false
    });
    var factors1 = [{label: "gender", name: "preferredGender", weight: 75, analyzeRef: "gender"}];
    var temp2 = Algorithm.calcMatchQuality(senior1,junior,factors1);
        if (temp2 == 0){
      done();
    }
    //Find out what is the value of the senior-junior pair
  });
});