/*
 * Created by talat on 06/09/15.
 */
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var tubeSchema = new mongoose.Schema({
    _Deleted:{type:Boolean,default:false},
    provider_id: { type : mongoose.Schema.Types.ObjectId, ref:'Provider' },
    metadata:{type:mongoose.Schema.Types.Mixed},
    type:{type:String},
    comment:{type:String},
    color:{
    	name:{type:String},
    	hashcode:{type:String}
    },
    company:{type:String},
    size:{type:String},
    container:{type:String},
    unit:{type:String},
    externalId:{type:String}
},{strict:false});

tubeSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Tube',tubeSchema);
