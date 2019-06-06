/**
 * Created by burhan on 21/08/16.
 */
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var attendanceSchema = new mongoose.Schema({
	att_date:{type:Date},  
 	punchin_time:{type:String},
 	punchout_time:{type:String},
	user_id:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
},{strict:false});
attendanceSchema.plugin(mongoosePaginate);
attendanceSchema.pre('find',function(next){
	this.populate('user_id');
  	next();
});
attendanceSchema.pre('findOne',function(next){
	this.populate('user_id');
  	next();
});

module.exports = mongoose.model('Attendance',attendanceSchema);
