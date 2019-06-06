var mongoose = require("mongoose");
var mongoosePaginate = require('mongoose-paginate');


var weekoffrequest = new mongoose.Schema({
	_Deleted:{type:Boolean,default:false},
	provider_id: { type : mongoose.Schema.Types.ObjectId, ref:'Provider' },
	user_id:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
	requestdate:{type:Date},
	requesttodate:{type:Date},
	leavereason: {type:String},
	leavetype:{type:String},
	status:{type:String,enum:['open','accepted','rejected','reopen']},	
	type:{type:String,enum:['requested','assigned','training']},
	createdby:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
	createdbyrole: {type:String},
	requesttype: {type:String},
	requesttime: Number,
	requesttotime: Number,

	log: 
	[
        {
            updatedby: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            updateddatetime: Date,
            reason_id: {
            	type: mongoose.Schema.Types.ObjectId,
                ref: 'OptionMaster'
            },
            otherreasontext: String,
            old: { type: mongoose.Schema.Types.Mixed },
            new: { type: mongoose.Schema.Types.Mixed }
        }
    ]

	// month:{type:Number}

},{strict:false});

weekoffrequest.pre("find",function(next){
	this.populate("user_id");
	next();
});	

weekoffrequest.pre("findOne",function(next){
	this.populate("user_id");
	next();
});

weekoffrequest.plugin(mongoosePaginate);
module.exports = mongoose.model('WeekOffRequest', weekoffrequest);