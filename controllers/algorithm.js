var Cohort = require('../models/Cohort');
var Application = require('../models/Application');
var _ = require('lodash');


exports.setWeights = function(req, res) {
  var factors=req.body.factors;
  console.log(factors);
  
  Application.find({ cohort: res.locals.activeCohort, accepted: true }, function(err, applications) {
    
    var matrix = calcMatrix(applications);  // This is an optional helper function
    console.log( JSON.stringify(matrix,null,4) );
    res.status(200).json(matrix);
  });

};


function calcMatrix(applications){
  return applications.map(function(row) {
        return {
          aid: row._id,   // Each row stores the applicationID (aid) for reference
          matches: applications.map(function(col) {
                return { aid: col._id, score: Math.random() };
             })
             .sort(function(a,b){ 
                return (a.score > b.score);
             })
        };          
  });

}
