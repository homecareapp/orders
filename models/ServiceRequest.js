var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var async = require('async');
var Order = require('./Order');


var tempDate = new Date();
var tempNumber = new Number();

var serviceRequestSchema = new mongoose.Schema({
    _Deleted:{type:Boolean,default:false},
    client_id : { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    provider_id: { type : mongoose.Schema.Types.ObjectId, ref:'Provider' },
    datetime:Date,
    createdby:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment:String,
    discount:{ 
     discount: Number,
     discountreason: String
    },
    totalreceiptamount:{type:Number},
    amount:{type:Number},
    services: [
      {
        service_id: {
          code:String,
          name:String,
          price:Number
        }
      }
    ],
    fromdate:{type:Date,default:Date.now()},
    fromtime:{type:Number},
    todate:{type:Date,default:Date.now()},
    totime:{type:Number},
    call_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Call' },
    status:{type:String,default:'Open'},//open,closed
    referralsource:{type:String}, //
    source: {type:String},
},{strict:false});


// serviceRequestSchema.statics.saveServiceRequest = function(data,callback)
// {

// 	var serviceRequest = this.model('ServiceRequest');
//   var addServices = new serviceRequest(data);
//   addServices.save(function(error,result){
//     if (error) return callback(error);
//     Order.saveOrder(data, callback)

//     return callback(null,result);

//   });
// }


serviceRequestSchema.pre("find",function(next){
  this.populate("client_id createdby call_id");
  next();
});

serviceRequestSchema.pre("findOne",function(next){
  this.populate("client_id createdby call_id");
  next();
});


serviceRequestSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('ServiceRequest',serviceRequestSchema);