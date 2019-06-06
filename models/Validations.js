var _ = require('lodash');


exports.validateEnum = function(modelname, attribute, enumvalue) { 
  if (!modelname || !attribute || !enumvalue) return false;  
  var enumArray = modelname.schema.path(attribute).enumValues;
  if (_.indexOf(enumArray, enumvalue) >= 0)
    return true;
  else
    return false;
};
