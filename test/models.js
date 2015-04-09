var chai = require('chai');
var should = chai.should();
var User = require('../models/User');

describe('User Model', function() {
  it('should create a new user', function(done) {
    var user = new User({ // create a new user
      email: 'test@gmail.com',
      password: 'password'
    });
    user.save(function(err) { // save the user to the database
      if (err) return done(err); // if there is error, the test fails
      done();
      //if you are here, the test passed
    })
  });

  it('should not create a user with the unique email', function(done) {
    var user = new User({ // try to create a new user
      email: 'test@gmail.com', // NOTICE: the same email as the user above
      password: 'password'
    });
    user.save(function(err) { // try to save the user to the database
      // the error will be generated because the user with given email exists already
      if (err) err.code.should.equal(11000);
      done();
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
     // remove the user from database with given email below
    User.remove({ email: 'test@gmail.com' }, function(err) {
      if (err) return done(err); // there should be no erors
      done();
      //if you are here, the test passed
    });
  });
});
