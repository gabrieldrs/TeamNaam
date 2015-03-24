var chai = require('chai');
var should = chai.should();
var Application = require('../models/Application');

describe('Application Form', function() {
  it('should create a new applicant in db', function(done) {
    var student1 = new Application({
      fName: 'Bob',
      lName: 'Marley',
      StudentN: '12345678',
      email: 'test@gmail.com',
      student: true
    });

    student1.save(function(err){
      if(err)
        throw err;
      done();
    });
  });


  it('Student Number error', function(done) {
    var student2 = new Application({
      
      fName: 'Should',
      lName: 'Fail',
      StudentN: '12345678',
      email: 'test2@gmail.com'
    });
   student2.save(function(err){
      if(err)
        err.code.should.equal(11000); // the appropriate error code
      done();
   });
 });

     it('should create a new mentor in db', function(done) {
    var student1 = new Application({
      fName: 'Spongebob',
      lName: 'Squarepants',
      PhoneNo: '604-111-1111',
      email: 'testa@gmail.com',
      student: true
    });

    student1.save(function(err){
      if(err)
        throw err;
      done();
    });
  });


  it('Phone Number error', function(done) {
    var student2 = new Application({
      
      fName: 'Should',
      lName: 'Fail',
      PhoneNo: '604-111-1111',
      email: 'test2@gmail.com'
    });
   student2.save(function(err){
      if(err)
        err.code.should.equal(11000); // the appropriate error code
      done();
   });
  });

});
