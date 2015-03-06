var mongoose = require('mongoose');

var applicationSchema = new mongoose.Schema({
  'student number': String,
  'cohort': String,
  'email': String,
  
  'adminComment': { type: String, default: '' },
  'student': { type: Boolean, default: true },
  'senior': { type: Boolean, default: false },
  'accepted': { type: Boolean, default: false },
  'submissionDate': { type: Date, default: Date.now }
  
}, { strict: false });  // THIS "STRICT" STEETING MEANS WE CAN SAVE ANYTHING WE WANT HERE. THIS IS MORE DANGEROUS SO MAKE SURE YOU SANITIZE EVERYTHING. THIS IS USED FOR DYNAMIC FORM GENERATION.  SEE MORE AT: http://mongoosejs.com/docs/guide.html#strict

module.exports = mongoose.model('Application', applicationSchema);
