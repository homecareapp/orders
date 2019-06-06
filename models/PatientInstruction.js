/**
 * Created by talat on 28/10/15.
 */
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');



var patientInstructionSchema = new mongoose.Schema({
    _Deleted:{type:Boolean,default:false},
    metadata:{type:mongoose.Schema.Types.Mixed},   
    provider_id: { type : mongoose.Schema.Types.ObjectId, ref:'Provider' }, 
    name:{type:String, required:true},
    description:{type:String},    
    source: {type:String,default:'webadmin'}
},{strict:false});

patientInstructionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('patientInstruction',patientInstructionSchema);