var mongoose = require('mongoose');

var applicationSchema = new mongoose.Schema({
  'cohort': {type:String, require:true},
  'email': {type:String, require:true},
  'fName' : {type:String, require:true},
  'lName' : {type:String, require:true},
  'age' : {type:Date, require:true},
  'availability' : {type:Array,require:true},

  'adminComment': { type: String, default: '' },
  'student': { type: Boolean, default: true },
  'senior': { type: Boolean, default: false },
  'accepted': { type: Boolean, default: false },
  'submissionDate': { type: Date, default: Date.now }

}, { strict: false });  // THIS "STRICT" STEETING MEANS WE CAN SAVE ANYTHING WE WANT HERE. THIS IS MORE DANGEROUS SO MAKE SURE YOU SANITIZE EVERYTHING. THIS IS USED FOR DYNAMIC FORM GENERATION.  SEE MORE AT: http://mongoosejs.com/docs/guide.html#strict


var model = mongoose.model('Application', applicationSchema);

//Validate availability field
model.schema.path('availability').validate(function(value){
  var days = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
  value.forEach(function(e){
    if (days.indexOf(e) == -1){
      return false;
    }
  });
  return true;
});


//These are the required fields for both forms, and are considered the elementary ones necessary for the application
model.schema['formProperties'] = {
  'phoneNumber': {label:"Phone Number", formType:"number", student:false, mentor:true},
  'studentNo': {label:"Student Number", formType:"number", student:true, mentor:false},
  'fName' : {label:"First Name", formType:"string", student:true, mentor:true},
  'lName' : {label:"Last Name", formType:"string", student:true, mentor:true},
  'email': {label:"Email", formType:"email", student:true, mentor:true},
  'age' : {label:"Age", formType:"date", student:true, mentor:true},
  'availability' : {label:"Availability", formType:"checkboxGroup", values: ["Monday","Tuesday","Wednesday","Thursday","Friday"], student:true, mentor:true}
}


module.exports = model;
