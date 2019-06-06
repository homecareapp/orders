var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var importSchema = new mongoose.Schema({
	//rownumber: { type: Number },
    status: { type: String, enum: ["Failed", "Inprogress", "Completed"] }, 
    provider_id: {type: mongoose.Schema.Types.ObjectId,ref: 'Provider'},
    user_id: {type: mongoose.Schema.Types.ObjectId,ref: 'User'},
    file: String,  
    collectionname: String,    
    error: { type: mongoose.Schema.Types.Mixed },
    data: { type: mongoose.Schema.Types.Mixed }, //import data
    result: { type: mongoose.Schema.Types.Mixed }, //count data
    datetime: { type: Date, default: Date.now }
});

importSchema.pre('find',function(next){
  this.populate('user_id');
  next();
});

importSchema.pre('findOne',function(next){
  this.populate('user_id');
  next();
});

importSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('ImportLog', importSchema);