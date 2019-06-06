/**
 * Created by talat on 06/09/15.
 */
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');


var menuSchema = new mongoose.Schema({
	  _Deleted:{type:Boolean,default:false},
    provider_id: { type : mongoose.Schema.Types.ObjectId, ref:'Provider' }, 
    name : {type:String}, 
    url : {type:String}, 
    state : {type:String}, 
    isParent : {type:Boolean, default:false},
    parentID : {type:String},
    isLabel : {type:Boolean, default:false},
    sequence: {type:Number},
    source: {type:String,default:'webadmin'}
});

// injection for mongoose paginate
menuSchema.plugin(mongoosePaginate)

menuSchema.pre('find',function(next){
  this.populate('parentID');
  next();
});

menuSchema.pre('findOne',function(next){
  this.populate('parentID');
  next();
});

module.exports = mongoose.model('Menu', menuSchema);