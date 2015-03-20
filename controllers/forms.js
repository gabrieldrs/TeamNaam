var fs = require("fs");

exports.getForm = function(identifier){
    if (identifier != undefined)
        return require('../models/forms/'+identifier.replace(' ','-')+'.json');
    return require('../models/forms/form-default.json');
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