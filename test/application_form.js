var chai = require('chai');
var should = chai.should();
var User = require('../models/User');

describe('Application Form', function() {
  it('should create a new applicant in db', function(done) {
    var student1 = new Application({
      fName: 'Bob',
      lName: 'Marley',
      StudentN: '12345678',
      email: 'test@gmail.com'
    });
    //user.save(function(err) {
    //  if (err) return done(err);
    //  done();
    //check if the application has been creaed in db
    })
  });

  it('Student Number error', function(done) {
    var student2 = new Application({
      fName: 'Should',
      lName: 'Fail',
      StudentN: '12345678'
      email: 'test2@gmail.com';
    });
  //  user.save(function(err) {
 //     if (err) err.code.should.equal(11000);
   //   done();
   //check for the error message, cuz this is wrong
    });
  });

  it('should find user by email', function(done) {
    User.findOne({ email: 'test@gmail.com' }, function(err, user) {
      if (err) return done(err);
      user.email.should.equal('test@gmail.com');
      done();
    });
  });

  it('should delete a user', function(done) {
    User.remove({ email: 'test@gmail.com' }, function(err) {
      if (err) return done(err);
      done();
    });
  });
});