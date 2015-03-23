var chai = require('chai');
var should = chai.should();
var User = require('../controllers/algorithm');

describe('Controllers algorithm', function() {
  it('MatchingValueMentorSenior', function(done) {
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
      email: 'test@gmail.com'
      student: true,
      senior: true
    });
    var mentor = new Application({
      fName: 'Albus',
      lName: 'Dumbledore',
      pNumber: '604-444-4444',
      email: 'testa@gmail.com',
      student: false
    });
    //Find out what is the value of the mentor-senior pair
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
      email: 'testh@gmail.com'
      student: true,
      senior: true
    });
    var junior = new Application({
      fName: 'Ginny',
      lName: 'Weasley',
      sNumber: '33333333',
      email: 'testg@gmail.com'
      student: true,
      senior: false
    });
    //Find out what is the value of the senior-junior pair
  });
});