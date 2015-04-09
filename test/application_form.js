var chai = require('chai');
var should = chai.should();
var Application = require('../models/Application');

describe('Application Form', function() {
  it('should create a new applicant in db', function(done) {
    var student1 = new Application({ // the new student is created
      fName: 'Bob',
      lName: 'Marley',
      StudentN: '12345678',
      email: 'test@gmail.com',
      student: true
    });

    student1.save(function(err){ // the student is being saved to the database
      if(err)
        throw err;
      done();
      // if you get here, the test passes
    });
  });


  it('Student Number error', function(done) {
    var student2 = new Application({ // the new student is created
      fName: 'Should',
      lName: 'Fail',
      StudentN: '12345678',
      email: 'test2@gmail.com'
    });
   student2.save(function(err){// the student is trying to be saved to the database
      if(err)
        err.code.should.equal(11000); // the appropriate error code
      done(); 
      // we know the error is here, because there exists student with same student number
   });
 });

     it('should create a new mentor in db', function(done) { // new mentor is created
    var student1 = new Application({
      fName: 'Spongebob',
      lName: 'Squarepants',
      PhoneNo: '604-111-1111',
      email: 'testa@gmail.com',
      student: true
    });

    student1.save(function(err){ // the mentor is being saved to the database
      if(err)
        throw err;
      done();
      // if you get here, the test passes
    });
  });


  it('Phone Number error', function(done) { // new mentor is created
    var student2 = new Application({
      
      fName: 'Should',
      lName: 'Fail',
      PhoneNo: '604-111-1111',
      email: 'test2@gmail.com'
    });
   student2.save(function(err){ // the mentor is trying to be saved to the database
      if(err)
        err.code.should.equal(11000); // the appropriate error code
      done();
        // we know the error is here, because there exists mentor with same phone number
   });
  });

});
