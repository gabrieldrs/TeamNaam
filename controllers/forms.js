var fs = require("fs");

exports.getForm = function(identifier){
    if (identifier !== "undefined")
        return require('../models/forms/form-'+identifier+'.json');
    return require('../models/forms/formDefault.json');
}

exports.getAllFormNames = function(){
    var forms = fs.readdirSync('./models/forms/');
    var formNames = {};
    for (var i in forms){
        if (forms[i]!= "formDefault.json")
            formNames[i] = forms[i].split('.')[0].replace('-',' ');
    }
    return formNames;
}