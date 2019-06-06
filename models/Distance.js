/**
 * Created by talat on 06/09/15.
 */
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var distanceSchema = new mongoose.Schema({
    _Deleted:{type:Boolean,default:false},
    metadata:{type:mongoose.Schema.Types.Mixed},
    from:{type:mongoose.Schema.Types.ObjectId,ref:'Area',required:true},
    to:{type:mongoose.Schema.Types.ObjectId,ref:'Area',required:true},
    majorarea:{type:mongoose.Schema.Types.ObjectId,ref:'Area'},
    distance: {type:Number}
},{strict:false});

distanceSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Distance',distanceSchema);