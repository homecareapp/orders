var mongoose = require('mongoose');
var async = require('async');
var mongoosePaginate = require('mongoose-paginate');
var secrets = require('../config/secrets');
var http = require('http');
var urlParser = require("url");


var callSchema = new mongoose.Schema({
    _Deleted:{type:Boolean,default:false},
    name:String,
    contactnumber: String,
    email: String,
    relation : String,
    datetime:Date,
    type: { type: String, enum: ['enquiry', 'generalenquiry', 'caregiverenquiry', 'dentalenquiry', 'physioenquiry', 'strokecareenquiry', 'dementiaenquiry', 'nursingenquiry', 'physicianenquiry', 'oncologyenquiry', 'feedback', 'servicerequest', 'complain', 'complaintresolution', 'requeststatus', 'others'] },
    inout:{type:String}, //incoming, outgoing
    comment:String,
    callreceivedby:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    client_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    partner_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
    provider_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
    area_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'Area' },
    callrequired:{type:Boolean},//open,closed
    referredby:String,
    referredbyname:String,
    source: {type:String},
    pincode:String
},{strict:false});

callSchema.pre("find",function(next){
  this.populate("client_id partner_id provider_id area_id");
  next();
});

callSchema.pre("findOne",function(next){
  this.populate("client_id partner_id provider_id area_id");
  next();
});

callSchema.statics.servicePriceList = function(data, cb) {
    var url = secrets.srlApiUrl;
    url += "/api/MRPDiscount"+data._parsedOriginalUrl.search;    
    //url += "/api/MRPDiscount?ClientCD=500000556&TestList=100000711,100000713,100000715&PRICEDT=21/01/2016"; 
    //console.log(url);
    //console.log(data._parsedOriginalUrl.search);
    var options = {
        hostname: urlParser.parse(url).hostname,
        path: urlParser.parse(url).path,
        port:urlParser.parse(url).port
    };
    var body = "";
    http.get(options, function(response) {
        //console.log("Got response: " + response.statusCode);
        //console.log('STATUS: ' + response.statusCode);
        //console.log('HEADERS: ' + JSON.stringify(response.headers));
        //response.setEncoding('utf8');
        response.on('data', function (chunk) {
          body += chunk;
        });
        response.on('end', function () {
          var data = JSON.parse(body);

          cb(null, data);
        });
        }).on('error', function(e) {
            console.log("Got Error - "+e);

            return cb(e);
    });
};

callSchema.statics.serviceTubeList = function(data, cb) {
    var url = secrets.srlApiUrl;
    url += "/api/MRPDiscount"+data._parsedOriginalUrl.search;    
    //url += "/api/MRPDiscount?ClientCD=500000556&TestList=100000711,100000713,100000715&PRICEDT=21/01/2016"; 
    //console.log(url);
    //console.log(data._parsedOriginalUrl.search);
    var options = {
        hostname: urlParser.parse(url).hostname,
        path: urlParser.parse(url).path,
        port:urlParser.parse(url).port
    };
    var body = "";
    http.get(options, function(response) {
        //console.log("Got response: " + response.statusCode);
        //console.log('STATUS: ' + response.statusCode);
        //console.log('HEADERS: ' + JSON.stringify(response.headers));
        //response.setEncoding('utf8');
        response.on('data', function (chunk) {
          body += chunk;
        });
        response.on('end', function () {
          var data = JSON.parse(body);

          cb(null, data);
        });
        }).on('error', function(e) {
            console.log("Got Error - "+e);

            return cb(e);
    });
};


callSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Call',callSchema);
