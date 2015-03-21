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



model.schema['formProperties'] = {
  'email': {label:"Email", formType:"email", require:true},
  'fName' : {label:"First Name", formType:"string", require:true},
  'lName' : {label:"Last Name", formType:"string", require:true},
  'age' : {label:"Age", formType:"date", require:true},
  'availability' : {label:"Availability", formType:"checkboxGroup",require:true, values: ["Monday","Tuesday","Wednesday","Thursday","Friday"]}
}


module.exports = model;
