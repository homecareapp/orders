var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var async = require('async');
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var customerSchema = new mongoose.Schema({
    metadata:{type:mongoose.Schema.Types.Mixed},
    username: { type: String, unique: true, lowercase: true },
    password: {type:String,select:false},
    mobilenumber:Number,
    tokens: {type:Array,select:false},
    role: String, //[mobileuser,provideradmin,provideruser,superuser],
    usertype: {type:String},//doctor,technician,
    applogin:{type:Boolean,default:true},
    department:Array,
    profile: {
      code:{type:String},
      firstname: { type: String },
      lastname: { type: String },
      gender: { type: String, default: '' },
      location: { type: String, default: '' },
      pincode:String,
      landmark:String,
      address1:String,
      address2:String,
      address3:String,
      email:{type:String,default:''},
      dob:Date
    },
    picture: { type: String },
    availability:{
      sunday:[ {fromtime:String,totime:String} ],
      monday:[ {fromtime:String,totime:String} ],
      tuesday:[ {fromtime:String,totime:String} ],
      wednesday:[ {fromtime:String,totime:String} ],
      thursday:[ {fromtime:String,totime:String} ],
      friday:[ {fromtime:String,totime:String} ],
      saturday:[ {fromtime:String,totime:String} ]
    },
    pictureinfo: {type:mongoose.Schema.Types.Mixed},
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    devices:[{
        device:String,
        deviceid:String
    }],
    iscoordinator:Boolean,
    preferences:{
        pushnotify:{type:Boolean,default:true}
    },
    verified:{type:Boolean,default:false},
    orders: [], //Added By TalatM Not pat of schema
    _Deleted:{type:Boolean,default:false}
});



customerSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Customer', customerSchema);
