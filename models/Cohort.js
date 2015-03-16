var mongoose = require('mongoose');

var cohortSchema = new mongoose.Schema({

  title: { type: String, default: 'Cohort 1' },
  description: { type: String, default: 'Give me a description.' },
  status: { type: Boolean, default: false },
  formLock: { type: Boolean, default: false },
  form: { type: String, default: 1 },
  secret: { type: String, default: function(){ return require('crypto').randomBytes(18).toString('base64').replace(/\//g,'_').replace(/\+/g,'-');} },
  
});

module.exports = mongoose.model('Cohort', cohortSchema);
