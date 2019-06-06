var mongoose = require('mongoose');
var async = require('async');
var Model = require('../models/Order');
var ModelPartner = require('../models/Partner');
var ModelAddress = require('../models/Address');

var ModelClient = require('../models/Client');
var ProviderModel = require('../models/Provider');
var PartnerModel = require('../models/Partner');
var AreaModel = require('../models/Area');

var helperVisitCharge = require('./helpervisitcharge');
var addressController = require('./address');
var partnerServiceController = require('./partnerservice');

var _ = require("lodash");
var moment = require('moment-timezone');
var TIMEZONE = require('../config/secrets').TIMEZONE;


function getById(id, callback) {
    var result;
    
    var getOrder = function(next) {
        var populate = [
            {
                path: 'partner_id',
                select: '_id info.name paymentoptions reportdeliverymode visitcharges areas discounts droppoints sharetubes'
            },
            {
                path: 'services.service_id',
                select: 'name _id code price alias customerinstruction specialinstruction specialinstructions customerinstructions childs postsample postservices sampletype description tubes pendingtubes discountnotapplicable customerinstructiontype masterservice category'                
            },
            {
                path: 'client_id',
                select: '_id externalId demography specialneeds'
            },
            {
                path: 'log.updatedby',
                select: '_id profile.name'
            },
            {
                path: 'statuslog.statusby',
                select: '_id profile.name'
            },
            {
                path: 'assignto',
                select: '_id profile.name profile.mobilenumber'
            },
            {
                path: 'assignby',
                select: '_id profile.name'
            },
            {
                path: 'logistic.logistic_id',
                select: '_id profile.name profile.mobilenumber'
            }
        ]

        getOrderById(id, {}, populate, function(e,r) {
            result = r;
            // return next(null); 
            if (result.status == "Open" || result.status == "Unassigned" || result.status == "Reached" || result.status == "Recieved") {
                helperVisitCharge.calculateVisitCharge(result.orderGroupId,result.fromdate, result.fromtime, result.partner_id._id, function (e, visitcharge) {            
                    if (e) next(null);
                    result.paymentdetails.visitingcharges = (visitcharge.fastingVisitsCharge + visitcharge.ppVisitCharge - visitcharge.collectedVisitCharge);
                    result.paymentdetails.totalvisitingcharges = visitcharge.fastingVisitsCharge + visitcharge.ppVisitCharge;
                    result.paymentdetails.collectedVisitCharge = visitcharge.collectedVisitCharge;
                    result.specialneed = result.client_id.specialneeds;
                    delete result.client_id.specialneeds;

                    return next(null);
                });
            }else if (result.status == "Completed" || result.status == "SampleCollected" || result.status == "SampleHandover" ) {
                result.specialneed = result.client_id.specialneeds;
                delete result.client_id.specialneeds;
                return next(null);
            }
            else
                return next(null);
        });
    }

    var getLinkedOrder = function(next){
        if(result.ordertype == "F"){
            getPPOrder(result._id, function (e,r) {
                result.ppOrder = r;
                return next(null);
            });
        }
        else{
            
            function options(){
                return {fromtime:1,fromdate:1,servicedeliveryaddress:1,orderGroupId:1,status:1, services:1};
            }

            function populate() {
                return [];
            }
            getOrderById(result.parentorder_id, options(),populate(),function (e,r) {
               result.fastingOrder = r;
               return next(null);    
            });
        }
    }

    var getAddressDetails = function(next){
        var inputParams = {
            partner_id:result.partner_id._id,
            ids:[result.servicedeliveryaddress._id]
        }
        addressController.getAddresses(inputParams, function(e,address){
            result.servicedeliveryaddress = address[0];
            return next(null);
        });
    }

    var getClientAddresses = function(next){
        var inputParams = {
            partner_id:result.partner_id._id,
            ids:[]
        }
        // if(result.client_id.demography.addresses)
        // {
        //     if(result.client_id.demography.addresses.length)
        //     {
                
        //     }
        // }
        if(result.client_id.demography.addresses)
        {
            result.client_id.demography.addresses.forEach(function(addr){
                inputParams.ids.push(addr._id);
            });
            addressController.getAddresses(inputParams, function(e,addresses){
                result.client_id.demography.addresses = addresses;
                return next(null);
            });
        }
        else
        {
            result.client_id.demography.addresses = [];
            return next(null);
        }
            
    }
    
    var getPrescrtCount = function(next){
        getPrescriptionCount(result._id, function(e,count){
            result.prescriptioncount = 0; //default zero
            
            if(e) return next(null);
            result.prescriptioncount = count;
            return next(null);
        });
    }

    var getCIAndTubes = function(next){
        partnerServiceController.getTubesAndCI(result.services, result.partner_id.sharetubes, function(e,r) {
            result.tubes = r.tubes;
            result.patientIntruction = r.ci;
            result.specialIntruction = r.si;
            return next(null);
        });
    }

    function mergeDuplicates(list, prop, cb){
      return list.sort(function(a,b){
        if(a[prop] < b[prop]){ return -1;}
        if(a[prop] > b[prop]){return 1;}
        return 0;
      }).reduce(function(acc, item, index, array){
        if(index > 0 && array[index-1][prop] === item[prop]){
          cb(acc[acc.length-1], item);
          return acc;
        }else{
          var newItem = Object.assign({}, item);
          cb(newItem);
          acc.push(newItem);
          return acc;
        }
      }, []);
    }


    var addPendingTubes = function(next){
        if(result.ordertype == "F")
        {
            return next(null)
        }
        else
        {
            if(!result.pendingtubes)
            {
                result.pendingtubes = [];
            }

            var list = result.pendingtubes.concat(result.tubes);

            for (var i = 0; i < list.length; i++) {
                if(list[i]._id)
                {
                    list[i]._id = list[i]._id.toString();
                }
            }

            var newList = mergeDuplicates(list, "_id", function(item, dup){
                if(dup){
                  //item.count++;
                  item.count += dup.count;
                }
                // else{
                //   item.count = 1;
                // }        
            });
        }

        //sort tubes
        partnerServiceController.sortTubes(newList, 'TubeType', function(e,sotredTubes){
            result.tubes = sotredTubes;
            return next(null);
        });

        //result.tubes = newList;
        //return next(null);
    }

    var addpaymentoptions = function(next){
        if(!result.paymentdetails.paymentoptions)
        {
            result.paymentdetails.paymentoptions = [];
        }
        if(!result.paymentdetails.paymentoptions.length)
        {
            if(result.paymentdetails.paymentoption)
                result.paymentdetails.paymentoptions.push(result.paymentdetails.paymentoption);
        }
        return next(null)
    }

    var setdiscountapplicable = function(next){
        if(!result.paymentdetails.orderDiscount)
        {
            result.paymentdetails.orderDiscount = [];
        }
        for (var i = 0; i < result.paymentdetails.orderDiscount.length; i++) {
            if(!result.paymentdetails.orderDiscount[i].discountapplicable)
            {
                result.paymentdetails.orderDiscount[i].discountapplicable = 'TEST'
            }
        }
        return next(null)
    }

    async.waterfall([getOrder, getLinkedOrder, getAddressDetails, getClientAddresses, getPrescrtCount, getCIAndTubes, addPendingTubes, addpaymentoptions, setdiscountapplicable],function(error) {
        if(error) return callback(error);
        return callback(null, result); 
    });
}

exports.getOrderById = getOrderById

function getOrderById(id, options, populate, callback){
    if(typeof options == "function") {
        callback = options;
        options = null;
    }
    else{
        options = {signature:0, prescriptions:0, schedulenotification:0, todate:0, totime:0};
    }
    if(typeof populate == "function") {
        callback = populate;
        populate = null;
    };
    if(!id) return callback("id missing");
    if(!populate) populate = populateOrder;


    Model.findById(id,options,{lean:true},function (e,r) {
        if(e) return callback(e);

        return callback(null, r);
    }).populate(populate);
}

//get PP order
function getPPOrder(parentId, callback) {
    // If Order type is fasting show   
    var search = {
        ordertype: "PP",
        parentorder_id: parentId,
        status:{$ne:"Cancelled"}
    }
    Model.findOne(search,{fromtime:1,fromdate:1,servicedeliveryaddress:1,orderGroupId:1,status:1, services:1, partner_id:1},{lean:true},function(error, ppOrder) {
        if (error) return callback(error);
        if(!ppOrder) return callback(null);
        var inputParams = {
            partner_id: ppOrder.partner_id,
            ids:[ppOrder.servicedeliveryaddress._id]
        }
        addressController.getAddresses(inputParams, function(e,addresses){
            ppOrder.servicedeliveryaddress = addresses[0];
            return callback(null, ppOrder)           
        })
    });   
}

//orders should be in object
function getPrescriptionCount (orderId, callback) {
    if(!orderId)  return prescriptionCB(new Error("Order ID not found"));
    Model.aggregate([
        { "$match" : { _id: orderId }}, 
        { $project: { prescriptioncount: { $size: "$prescriptions" } } } ], function(e, orderaggr){
            if (e) return callback(e);

            return callback(null, orderaggr[0].prescriptioncount)
    });
};

exports.getById = getById;



