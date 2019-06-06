/**
 * Created by talat on 06/09/15.
 */
var mongoose = require('mongoose');

var weekOffSchema = new mongoose.Schema({
    _Deleted:{type:Boolean,default:false},
    metadata:{type:mongoose.Schema.Types.Mixed},
    user_id:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    date:{type:Date}, //weekoff date
    day:{type:String}, //weekoff day
    month:{type:Number}, //Month of weekoff
    year:{type:Number}, //year of weekoff
    type:{type:String,default:'auto'} //auto or request
},{strict:false});

weekOffSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('WeekOff',weekOffSchema);
