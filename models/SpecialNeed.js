/**
 * Created by talat on 28/10/15.
 */
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var specialNeedSchema = new mongoose.Schema({
	provider_id: { type : mongoose.Schema.Types.ObjectId, ref:'Provider' },
    _Deleted:{type:Boolean,default:false},
    metadata:{type:mongoose.Schema.Types.Mixed},    
    name:{type:String, required:true, uppercase: true},
    description:{type:String},    
    source: {type:String,default:'webadmin'}
},{strict:false});

specialNeedSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('SpecialNeed',specialNeedSchema);