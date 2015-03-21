var fs = require("fs");
var mongoose = require('mongoose');
var _ = require('lodash');

exports.getForm = function(identifier){
    var form;
    if (identifier != undefined)
        form = require('../models/forms/'+identifier.replace(' ','-')+'.json');
    else
        form = require('../models/forms/form-default.json');
    var schema = mongoose.model('Application').schema['formProperties'];
    var newFields = [];
    _.forEach(schema,function(f,i){
        var newField = {
            "name": i,
            "label": f['label'],
            "type": f['formType'],
            "values": (f['values'])?f['values']:"",
            "alt": "",
            "weight": 75,
            "student":true,
            "mentor": true,
            "required": true,
            "analyze":false
        };
        newFields.push(newField);
    });
    form = newFields.concat(form);
    return form;
}

exports.getAllFormNames = function(){
    var forms = fs.readdirSync('./models/forms/');
    var formNames = {};
    for (var i in forms){
        if (forms[i]!= "form-default.json")
            formNames[i] = forms[i].split('.')[0].replace('-',' ');
    }
    return formNames;
}