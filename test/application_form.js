var chai = require('chai');
var should = chai.should();
var User = require('../models/Application');

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
    //check if the application has been created in db
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
   student2.save(function(err){
      if(err)
        err.code.should.equal(); // the appropriate error number
      done();
   });
   //check for the error message, cuz this is wrong, 2 similar student numbers
    });
  });

  });
});