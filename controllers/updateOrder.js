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

var getbyid = require('./getbyid');

var _ = require("lodash");
var moment = require('moment-timezone');
var TIMEZONE = require('../config/secrets').TIMEZONE;
var ModelUser = require('../models/User');

var globalLogKeyPair = require("../data/logkeypair");

function updateOrder(params, callback) {
    switch(params.action){
        case "specialneed":
            updateSpecialNeed(params,function(e){
                if(e) return callback(new Error(e));
                getbyid.getById(params.id, function(err, r) {
                    return callback(null, r);
                });
            });
            break;
        case "droppoints":
            updateDropPoint(params,function(e){
                if(e) return callback(new Error(e));
                getbyid.getById(params.id, function(err, r) {
                    return callback(null, r);
                });
            });
            break;
        case "paymentoption":
            updatePaymentoption(params,function(e){
                if(e) return callback(new Error(e));
                getbyid.getById(params.id, function(err, r) {
                    return callback(null, r);
                });
            });
            break;
        case "discounts":
            updateDiscount(params,function(e){
                if(e) return callback(new Error(e));
                getbyid.getById(params.id, function(err, r) {
                    return callback(null, r);
                });
            });
            break;
        case "demography":
            updateDemography(params,function(e){
                if(e) return callback(new Error(e));
                getbyid.getById(params.id, function(err, r) {
                    return callback(null, r);
                });
            });
            break;
        case "pendingtubes":
            updatePendingTubes(params,function(e){
                if(e) return callback(new Error(e));
                getbyid.getById(params.id, function(err, r) {
                    return callback(null, r);
                });
            });
            break;
        case "unassigned":
            unassignPhlebo(params,function(e){
                if(e) return callback(new Error(e));
                getbyid.getById(params.id, function(err, r) {
                    return callback(null, r);
                });
            });
            break;
        case "testupdatereason":
            updateTestReason(params,function(e){
                if(e) return callback(new Error(e));
                getbyid.getById(params.id, function(err, r) {
                    return callback(null, r);
                });
            });
            break;
        case "discountreason":
            updateDiscountReason(params,function(e){
                if(e) return next(new Error(e));
                getbyid.getById(params.id, function(err, r) {
                    return callback(null, r);
                });
            });
            break;
        case "reportdeliverymode":
            updateReportDeliveryMode(params,function(e){
                if(e) return callback(new Error(e));
                getbyid.getById(params.id, function(err, r) {
                    return callback(null, r);
                });
            });
            break;
        default:
            return callback(new Error("No action found"));

    }
};

exports.updateOrder = updateOrder;

//updateSpecialNeed
function updateSpecialNeed (params,callback){
    if(!params.id) return callback("id not found");
    var updateObj = {specialneed:params.updateobj}, logs = [], statuslog=[], 
    assignedto, snPhleboRequired = false, changePhlebo = false;

    
    // waterfall get user function
    function getUser(next){
        if(!assignedto) return next(null);

        
        //get users to check current phlebo is eligible for visit
        ModelUser.findById(assignedto,{specialneedlist:1},{lean:true}, function (e,r) {
            if(e) return next(e);
            user = r;
            if(!params.specialneedlist.length && snPhleboRequired) changePhlebo = true; //need to change phlebo

            return next(null)
        });
    }//end of getUser 

    //waterfaall update client specialneed
    var updateClient = function(next) {
        params.specialneedflag = true; //DEFAULT TRUE
        if(!Array.isArray(params.updateobj)) params.updateobj = [];
        if(!params.updateobj.length) params.specialneedflag = false;

        var updateParams = {
            specialneeds: params.updateobj
        };

        ModelClient.update({_id:params.client_id}, {$set: updateParams}, function(e,r){
            return next(null);
        });
    } //end of update client

    //change status to Unassigned
    function statusLog(){
        var statusLogObj = {
            status: "Unassigned",
            comment: "Specialneed changed and phlebo was not eligible for visit.",
            statustimestamp: moment().tz(TIMEZONE).toISOString(), //client date time
            statusby: params.user_id,
            coordinates: params.coordinates
        }
        statuslog.push(statusLogObj);
    }

    //update order specialneed, log, statuslog, assignedto
    function updateOrder(next){
        updateObj.log = logs;
        if(!params.updateobj.length) updateObj.specialneedflag = false;
        // if old phlebo was not eligible for this special need
        if(changePhlebo) {
            updateObj.assignedto = undefined;
            statusLog();
            updateObj.statuslog = statuslog; //update object
        }

        //function to update the order
        update(params.id,updateObj,function(e,r){
            if(e) return next(e)

            return next(null);
        }); 
    }//end of update order 

    // get order logs of given partner users
    var getOrder = function(next){
        var option = {log:1, assignedto:1, status:1, statuslog:1, client_id:1};

        var log = function(order, newArr, oldArr){
            logs = order.log;
            if(!Array.isArray(logs)) logs = [];
            var logobj = {};
            //update log object only when its changes            
            logobj.comments = "Specialneed updated."// + params.updateobj.name;
            logobj.updatedby = params.user_id;
            logobj.updateddatetime = moment().tz(TIMEZONE).toISOString(); //client date time
            logobj["new"] = newArr;
            logobj["old"] = oldArr;
            logs.push(logobj);
        }
        // get order
        getbyid.getOrderById(params.id, option, [], function (e,order) {
            if(e) return next(e);
            if(!order) return next("No order found");
            //log(order);
            statuslog = order.statuslog;            
            assignedto = order.assignedto;
            params.client_id = order.client_id;

            var oldObj = order.specialneed;
            var newObj = params.updateobj;

            var arraykey = 'specialneed';
            var newOldArr = getOldNewLogArray(oldObj, newObj, arraykey)
            var oldArr = newOldArr.oldArr;
            var newArr = newOldArr.newArr;

            // logobj["new"] = newArr;
            // logobj["old"] = oldArr;

            if(newArr.length)
            {
                log(order, newArr, oldArr);
                
                return next(null);
            }
            else
            {
                logs = order.log;
                
                return next(null);
            }

            return next(null);  
        })
    }// end of getOrder

    async.waterfall([getOrder, updateOrder, updateClient],function(err) {
        if(err) return callback(err);

        return callback(null);
    });
}

// updateDropPoint
function updateDropPoint(params, callback){
    if(!params.updateobj) return callback("Droppoint address not found");
    if(!params.updateobj.address) return callback("Address not found");
    if(!params.updateobj.coordinates) return callback("Coordinates not found");
    if(!params.updateobj._id) return callback("Droppoint _id not found");

    var updateObj = {droppointaddress:params.updateobj}, logs = [];
    // get order logs of given partner users
    var getLogs = function(next){
        var option = {log:1, droppointaddress:1};
        // get order
        getbyid.getOrderById(params.id, option, [], function (e,order) {
            if(e) return next(e);
            if(!order) return next("No order found");

            logs = order.log;
            var logobj = {};
            //update log object only when its changes
            if (order.droppointaddress) {
                if(order.droppointaddress._id != params.updateobj._id){
                    //logobj.comments = "Droppoint updated to " + params.updateobj.address;
                    logobj.comments = "Droppoint updated";
                    logobj.updatedby = params.user_id;
                    logobj.updateddatetime = moment().tz(TIMEZONE).toISOString(); //client date time


                    // var oldObj = order.droppointaddress;
                    // var newObj = params.updateobj;

                    // var arraykey = 'droppoint';
                    // var newOldArr = getOldNewLogArray(oldObj, newObj, arraykey)
                    // var oldArr = newOldArr.oldArr;
                    // var newArr = newOldArr.newArr;

                    // logobj["new"] = newArr;
                    // logobj["old"] = oldArr;

                    // if(newArr.length)
                    // {
                    //     logs.push(logobj);
                    // }

                    logobj["new"] = [];
                    logobj["old"] = [];

                    logobj["old"].push({"key":"drop point","value":order.droppointaddress.address})
                    logobj["new"].push({"key":"drop point","value":params.updateobj.address})

                    logs.push(logobj);              
                }
            }
            return next(null);  
        })
    }// end of getLogs

    //update order droppointaddress, log
    function updateOrder(next){
        updateObj.log = logs;

        //function to update the order
        update(params.id,updateObj,function(e,r){
            if(e) return next(e)

            return next(null);
        }); 
    }//end of update order  

    async.waterfall([getLogs, updateOrder],function(err) {
        if(err) return callback(err);

        return callback(null);
    });
}

// updateDropPoint
function updatePaymentoption(params, callback){
    if(!params.updateobj) return callback("Paymentoption not found");
    if(!params.updateobj.paymentoptions) return callback("Paymentoptions required");
    if(!params.updateobj.paymentoptions.length) return callback("Paymentoptions not present");
    
    var updateObj = {"paymentdetails.paymentoptions":params.updateobj.paymentoptions}, logs = [], 
    discountFlag = false;
    // get order logs of given partner users
    var getLogs = function(next){
        var option = {log:1, paymentdetails:1};
        // get order
        getbyid.getOrderById(params.id, option, [], function (e,order) {
            if(e) return next(e);
            if(!order) return next("No order found");

            logs = order.log;
            var logobj = {};
            //update log object only when its changes
            if (order.paymentdetails) {
                // if(order.paymentdetails.paymentoption){                    
                //     //logobj.comments = "Payment option updated to " + params.updateobj.paymentoption;
                //     logobj.comments = "Payment option updated";
                //     logobj.updatedby = params.user_id;
                //     logobj.updateddatetime = moment().tz(TIMEZONE).toISOString(); //client date time

                //     logobj["old"] = [];
                //     logobj["new"] = [];

                //     logobj["old"].push({"key":"payment option","value":order.paymentdetails.paymentoption})
                //     logobj["new"].push({"key":"payment option","value":params.updateobj.paymentoption})

                //     logs.push(logobj);              
                // }
                if(!order.paymentdetails.paymentoptions)
                    order.paymentdetails.paymentoptions = [];
                if(order.paymentdetails.paymentoptions)
                { 
                    if(!order.paymentdetails.paymentoptions.length)
                    { 
                        if(order.paymentdetails.paymentoption)
                        {
                            order.paymentdetails.paymentoptions.push(order.paymentdetails.paymentoption)
                        }
                    }
                    logobj.comments = "Payment options updated";
                    logobj.updatedby = params.user_id;
                    logobj.updateddatetime = moment().tz(TIMEZONE).toISOString(); //client date time

                    logobj["old"] = [];
                    logobj["new"] = [];
                    var oldObj = order.paymentdetails.paymentoptions;
                    var newObj = params.updateobj.paymentoptions;

                    var arraykey = 'payment options';
                    var newOldArr = getOldNewLogArray(oldObj, newObj, arraykey)
                    var oldArr = newOldArr.oldArr;
                    var newArr = newOldArr.newArr;
                    logobj["new"] = newArr;
                    logobj["old"] = oldArr;

                    if(newArr.length)
                    {
                        logs.push(logobj)
                    }
                }
                
            }
            return next(null);  
        })
    }// end of getLogs

    //update order droppointaddress, log
    function updateOrder(next){
        updateObj.log = logs;

        //function to update the order
        update(params.id,updateObj,function(e,r){
            if(e) return next(e)

            return next(null);
        }); 
    }//end of update order  

    //get PP order and update
    function updatePPOrder(next) {
        // If Order type is fasting show   
        var search = {
            ordertype: "PP",
            parentorder_id: params.id,
            status:{$ne:"Cancelled"}
        }
        Model.findOne(search,{log:1, paymentdetails:1 },null,function(error, ppOrder) {
            if (error) return next(error);
            if(!ppOrder) return next(null);

            var log = function(ppOrder){
                
                if(!Array.isArray(logs)) logs = [];
                var logobj = {};
                //update log object only when its changes            
                // logobj.comments = "Payment option updated from fasting."
                // logobj.updatedby = params.user_id;
                // logobj.updateddatetime = moment().tz(TIMEZONE).toISOString(); //client date time

                // logobj["old"] = [];
                // logobj["new"] = [];

                // logobj["old"].push({"key":"payment options","value":ppOrder.paymentdetails.paymentoption})
                // logobj["new"].push({"key":"payment options","value":params.updateobj.paymentoption})

                if(!ppOrder.paymentdetails.paymentoptions)
                    ppOrder.paymentdetails.paymentoptions = [];
                if(ppOrder.paymentdetails.paymentoptions)
                { 
                    if(!ppOrder.paymentdetails.paymentoptions.length)
                    { 
                        if(ppOrder.paymentdetails.paymentoption)
                        {
                            ppOrder.paymentdetails.paymentoptions.push(ppOrder.paymentdetails.paymentoption)
                        }
                    }
                    logobj.comments = "Payment options updated from fasting.";
                    logobj.updatedby = params.user_id;
                    logobj.updateddatetime = moment().tz(TIMEZONE).toISOString(); //client date time

                    logobj["old"] = [];
                    logobj["new"] = [];
                    var oldObj = ppOrder.paymentdetails.paymentoptions;
                    var newObj = params.updateobj.paymentoptions;

                    var arraykey = 'payment options';
                    var newOldArr = getOldNewLogArray(oldObj, newObj, arraykey)
                    var oldArr = newOldArr.oldArr;
                    var newArr = newOldArr.newArr;
                    logobj["new"] = newArr;
                    logobj["old"] = oldArr;

                    if(newArr.length)
                    {
                        logs.push(logobj)
                    }
                }
                
            }

            logs = ppOrder.log;
            
            // if(ppOrder.paymentdetails.paymentoption != params.updateobj.paymentoption)
            // {
            //     log(ppOrder);
            // }
            log(ppOrder);

            update(ppOrder._id,{log:logs, 'paymentdetails.paymentoptions':params.updateobj.paymentoptions },function(e,r){
                if(e) return next(e)

                return next(null);
            });
            
        });   
    }

    async.waterfall([getLogs, updateOrder, updatePPOrder],function(err) {
        if(err) return callback(err);

        return callback(null);
    });
}

// updateDiscount
function updateDiscount(params, callback){
    if(!params.updateobj) params.updateobj = []; //TO APPLY ZERO DISCOUT
    // if(!params.updateobj.active) return callback("Discount not active");
    // if(!params.updateobj.name) return callback("Discount name not found");
    // if(!params.discount.discounttype) return callback("Discounttype not found");

    if(!Array.isArray(params.updateobj))
    {
        params.updateobj=[params.updateobj]
    }

    for (var i = 0; i < params.updateobj.length; i++) {
        if(!params.updateobj[i].discount) params.updateobj.discount = 0;
        if(!params.updateobj[i].discountrs) params.updateobj.discountrs = 0;
    }

    // if(!params.updateobj.discount) params.updateobj.discount = 0;
    // if(!params.updateobj.discountrs) params.updateobj.discountrs = 0;

    var updateObj = {"paymentdetails.orderDiscount":params.updateobj}, logs = [], 
    discountFlag = false;
    // get order logs of given partner users
    var getLogs = function(next){
        var option = {log:1, paymentdetails:1};
        // get order
        getbyid.getOrderById(params.id, option, [], function (e,order) {
            if(e) return next(e);
            if(!order) return next("No order found");

            logs = order.log;
            var logobj = {};
            //update log object only when its changes
            if (order.paymentdetails) {
                if(order.paymentdetails.orderDiscount){
                    //if(order.paymentdetails.orderDiscount._id != params.updateobj._id) {
                        //logobj.comments = "Discount updated to " + params.updateobj.name;
                        logobj.comments = "Discount updated";
                        logobj.updatedby = params.user_id;
                        logobj.updateddatetime = moment().tz(TIMEZONE).toISOString(); //client date time

                        var oldObj = order.paymentdetails.orderDiscount;
                        var newObj = params.updateobj;

                        var arraykey = 'discount';
                        var newOldArr = getOldNewLogArray(oldObj, newObj, arraykey)
                        var oldArr = newOldArr.oldArr;
                        var newArr = newOldArr.newArr;

                        logobj["new"] = newArr;
                        logobj["old"] = oldArr;

                        //var newOldArr = getOldNewLogArray(order.paymentdetails.orderDiscount, params.updateobj)

                        if(newArr.length)
                        {
                            logs.push(logobj);
                        }
                        //logs.push(logobj);                    
                        discountFlag = true;  
                    //}           
                }
            }
            return next(null);  
        })
    }// end of getLogs

    //update order droppointaddress, log
    function updateOrder(next){
        updateObj.log = logs;

        //function to update the order
        update(params.id,updateObj,function(e,r){
            if(e) return next(e)

            return next(null);
        }); 
    }//end of update order  

    async.waterfall([getLogs, updateOrder],function(err) {
        if(err) return callback(err);

        return callback(null);
    });
}

//client demography
function updateDemography(params, callback) {
    if(!params.id) return callback("id not found");
    if(!params.updateobj) return callback("Demography not found");
    var logs = [];

    //waterfall update client specialneed
    var updateClient = function(next) {

        function concatNames(params){
            if (params.firstname && params.lastname) {
                params.fullname = params.firstname.trim().concat(" ", params.lastname.trim());
                if (params.middlename) 
                    params.fullname = params.firstname.trim().concat(" ", params.middlename.trim(), " " ,params.lastname.trim());
            }
            return params.fullname;
        }

        function inputNames(){
            return {
                firstname:params.updateobj.demography.firstname,
                lastname:params.updateobj.demography.lastname,
                middlename:params.updateobj.demography.middlename
            }
        }
        params.updateobj.demography.fullname = concatNames(inputNames());
        
        var updateParams = {
            demography: _.cloneDeep(params.updateobj.demography), //inorder to break reference
            externalId: params.updateobj.externalId
        };

        updateParams.demography.addresses = [];
        if(!params.updateobj.demography.addresses){
            params.updateobj.demography.addresses = []
        }
        params.updateobj.demography.addresses.forEach(function(addr){
            updateParams.demography.addresses.push({_id:addr._id});
        });

        ModelClient.update({_id:params.client_id}, {$set: updateParams}, function(e,r){
            return next(null);
        });
    } //end of update client

    //update order log
    function updateOrder(next){
        //function to update the order
        update(params.id,{log:logs},function(e,r){
            if(e) return next(e)

            return next(null);
        }); 
    }//end of update order 

    // get order logs of given partner users
    var getOrder = function(next){
        var option = {log:1, client_id:1};

        var log = function(order, newArr, oldArr){
            logs = order.log;
            if(!Array.isArray(logs)) logs = [];
            var logobj = {};
            //update log object only when its changes            
            logobj.comments = "Client information updated"
            logobj.updatedby = params.user_id;
            logobj.updateddatetime = moment().tz(TIMEZONE).toISOString(); //client date time
            logobj["new"] = newArr;
            logobj["old"] = oldArr;
            logs.push(logobj);
        }
        // get order
        var popul = [{path: 'client_id',select: '_id externalId demography specialneeds'}];

        getbyid.getOrderById(params.id, option, popul, function (e,order) {
            if(e) return next(e);
            if(!order) return next("No order found");

            var newOldArr = getOldNewLogArray(order.client_id.demography, params.updateobj.demography)

            var oldArr = newOldArr.oldArr;
            var newArr = newOldArr.newArr;
            

            if(newArr.length)
            {
                log(order, newArr, oldArr);
                params.client_id = order.client_id._id;
                return next(null);
            }
            else
            {
                logs = order.log;
                params.client_id = order.client_id._id;
                return next(null);
            }
        })
    }// end of getOrder


    async.waterfall([getOrder, updateOrder, updateClient],function(err) {
        if(err) return callback(err);
        return callback(null);
    });
}

function updatePendingTubes(params, callback) {
    if(!params.id) return callback("id not found");
    if(!params.updateobj) return callback("Pending tubes not found");
    var logs = [];

    var getOrder = function(next){
        var option = {log:1, pendingtubes:1};
        var log = function(order){
            if(!Array.isArray(logs)) logs = [];
            var logobj = {};
            //update log object only when its changes            
            logobj.comments = "Pending tubes updated"
            logobj.updatedby = params.user_id;
            logobj.updateddatetime = moment().tz(TIMEZONE).toISOString(); //client date time
            logs.push(logobj);
        }
        // get order
        getbyid.getOrderById(params.id, option, [], function (e,order) {
            if(e) return next(e);
            if(!order) return next("No order found");
            logs = order.log;
            if(!order.pendingtubes) order.pendingtubes = [];
            if(!Array.isArray(order.pendingtubes)) order.pendingtubes = [];

            if(order.pendingtubes.length > 0 || params.updateobj.length > 0)
            {
                log(order);
            }
            return next(null);  
        })
    }

    //update order log and pendingtubes
    function updateOrder(next){
        //function to update the order
        update(params.id,{log:logs, pendingtubes:params.updateobj },function(e,r){
            if(e) return next(e)

            return next(null);
        }); 
    }//end of update order 

    //get PP order and update
    function updatePPOrder(next) {
        // If Order type is fasting show   
        var search = {
            ordertype: "PP",
            parentorder_id: params.id,
            status:{$ne:"Cancelled"}
        }
        Model.findOne(search,{log:1, pendingtubes:1 },null,function(error, ppOrder) {
            if (error) return next(error);
            if(!ppOrder) return next(null);

            var log = function(ppOrder){
                
                if(!Array.isArray(logs)) logs = [];
                var logobj = {};
                //update log object only when its changes            
                logobj.comments = "Pending tubes updated"
                logobj.updatedby = params.user_id;
                logobj.updateddatetime = moment().tz(TIMEZONE).toISOString(); //client date time
                logs.push(logobj);
            }
            logs = ppOrder.log;
            if(!ppOrder.pendingtubes) ppOrder.pendingtubes = [];
            if(!Array.isArray(ppOrder.pendingtubes)) ppOrder.pendingtubes = [];
            if(ppOrder.pendingtubes.length > 0 || params.updateobj.length > 0)
            {
                log(ppOrder);
            }

            update(ppOrder._id,{log:logs, pendingtubes:params.updateobj },function(e,r){
                if(e) return next(e)

                return next(null);
            });
            
        });   
    }

    async.waterfall([getOrder, updateOrder, updatePPOrder],function(err) {
        if(err) return callback(err);
        return callback(null);
    });
}

function unassignPhlebo(params, callback) {
    if(!params.id) return callback("id not found");
    if(!params.user_id) return callback("User not found")
    

    Model.findById(params.id, {log:1, statuslog:1, status:1, logistic:1, assignto:1}, {lean:true}, function(error, result) {
        if (error) return callback(error)
        if (!result) return callback("No order found");

        if (result.status == 'Unassigned'){
            return callback("Not allowed, visit already Completed");
        }
        if (result.status == "SampleCollected" || result.status == "Completed" || result.status == "Cancelled") {
            return callback("Not allowed, visit already Completed");
        }


    

        var statuslog = function() {
            if(!result.statuslog) result.statuslog = [];
            
            var statusLogObj = {
                status: "Unassigned",
                statustimestamp: Date(),
                comment: "Phlebo unassigned.",
                statusby: params.user_id,
                coordinates: params.coordinates
            }
            result.statuslog.push(statusLogObj);
            
            return result.statuslog;
        };

        var updateParams = {
            statuslog:      statuslog(),
            //log:          log(),
            status:         "Unassigned",
            assignto:       undefined,
            assignby:       undefined,
            logistic:       undefined
        } 

        async.waterfall([
            // get order by ID
            function(next) {
                var logobj = {};
                logobj["oldstatus"] = result.status;
                logobj["newstatus"] = "Unassigned";
                logobj["oldassignto"] = result.assignto;
                logobj["newassignto"] = undefined;
                logobj["comments"] = "Phlebo unassigned.";
                logobj["updatedby"] = params.user_id;
                logobj["updateddatetime"] = Date();
                logobj["old"] = [];
                logobj["new"] = [];
                ModelUser.findById(result.assignto, {profile:1}, {lean:true}, function(error, oldPhlebo) {
                    if(oldPhlebo)
                        logobj["old"].push({"key":"assign to","value":oldPhlebo.profile.name});
                    else
                        logobj["old"].push({"key":"assign to","value":"none"});
            

                    logobj["new"].push({"key":"assign to","value":"none"});

                    if (!result.log) result.log = [];
                        result.log.push(logobj);
                        updateParams.log = result.log;
                    return next(null)
                })
                
            }
        ],function(error) {
            Model.update({_id:params.id}, {$set:updateParams}, function(e,r){
                if(e) return callback(e);

                return callback(null);
            })
            
        })

        
        
    }).populate([]);
}

function updateTestReason(params, callback) {
    if(!params.id) return callback("id not found");
    if(!params.updateobj) return callback("Obj not found");
    if(!params.updateobj.serviceupdatecomment) return callback("updateobj not found");
    //update order serviceupdatecomment
    function updateOrder(next){
        //function to update the order
        update(params.id,{serviceupdatecomment:params.updateobj.serviceupdatecomment },function(e,r){
            if(e) return next(e)

            return next(null);
        }); 
    }//end of update order 

    async.waterfall([updateOrder],function(err) {
        if(err) return callback(err);
        return callback(null);
    });

}

function updateDiscountReason(params, callback) {
    if(!params.id) return callback("id not found");
    if(!params.updateobj) return callback("Obj not found");
    if(!params.updateobj.discountupdatecomment) return callback("updateobj not found");
    //update order serviceupdatecomment
    function updateOrder(next){
        //function to update the order
        update(params.id,{discountupdatecomment:params.updateobj.discountupdatecomment },function(e,r){
            if(e) return next(e)

            return next(null);
        }); 
    }//end of update order 

    async.waterfall([updateOrder],function(err) {
        if(err) return callback(err);
        return callback(null);
    });

}

function updateReportDeliveryMode(params, callback){
    if(!params.id) return callback("id not found");
    if(!params.updateobj) return callback("Report delivery mode not found");
    var logs = [];

    var getOrder = function(next){
        var option = {log:1, "paymentdetails":1};
        var log = function(order){
            if(!Array.isArray(logs)) logs = [];
            var logobj = {};
            //update log object only when its changes            
            logobj.comments = "Report delivery mode updated"
            logobj.updatedby = params.user_id;
            logobj.updateddatetime = moment().tz(TIMEZONE).toISOString(); //client date time
            logs.push(logobj);
        }
        // get order
        getbyid.getOrderById(params.id, option, [], function (e,order) {
            if(e) return next(e);
            if(!order) return next("No order found");
            logs = order.log;
            if(!order.paymentdetails) order.paymentdetails = {};
            if(!Array.isArray(order.paymentdetails.reportdeliverymode)) order.paymentdetails.reportdeliverymode = [];

            if(order.paymentdetails.reportdeliverymode.length > 0 || params.updateobj.length > 0)
            {
                log(order);
            }
            params.paymentdetails = order.paymentdetails;
            return next(null);  
        })
    }

    //update order log and pendingtubes
    function updateOrder(next){
        //function to update the order
        params.paymentdetails.reportdeliverymode = params.updateobj;
        update(params.id,{log:logs, paymentdetails:params.paymentdetails },function(e,r){
            if(e) return next(e)

            return next(null);
        }); 
    }//end of update order 

    //get PP order and update
    function updatePPOrder(next) {
        // If Order type is fasting show   
        var search = {
            ordertype: "PP",
            parentorder_id: params.id,
            status:{$ne:"Cancelled"}
        }
        Model.findOne(search,{log:1, paymentdetails:1 },null,function(error, ppOrder) {
            if (error) return next(error);
            if(!ppOrder) return next(null);

            var log = function(ppOrder){
                
                if(!Array.isArray(logs)) logs = [];
                var logobj = {};
                //update log object only when its changes            
                logobj.comments = "Report delivery mode updated"
                logobj.updatedby = params.user_id;
                logobj.updateddatetime = moment().tz(TIMEZONE).toISOString(); //client date time
                logs.push(logobj);
            }
            logs = ppOrder.log;
            if(!ppOrder.paymentdetails) ppOrder.paymentdetails = {};
            if(!Array.isArray(ppOrder.paymentdetails.reportdeliverymode)) ppOrder.paymentdetails.reportdeliverymode = [];
            if(ppOrder.paymentdetails.reportdeliverymode.length > 0 || params.updateobj.length > 0)
            {
                log(ppOrder);
            }

            ppOrder.paymentdetails.reportdeliverymode = params.updateobj;
            ppOrder.paymentdetails.reportdeliverymode.forEach(function(rptmode){
                if(rptmode.charge) rptmode.charge = 0;
            })
            update(ppOrder._id,{log:logs, paymentdetails:ppOrder.paymentdetails },function(e,r){
                if(e) return next(e)

                return next(null);
            });
            
        });   
    }

    async.waterfall([getOrder, updateOrder, updatePPOrder],function(err) {
        if(err) return callback(err);
        return callback(null);
    });
}

//generic update order
function update(id, params, callback){
    if(!id) return callback("update id missing");
    if(!params) return callback("no update object found");

    Model.findByIdAndUpdate(id, {$set: params}, function(e,r){
        if(e) return callback(e);
         return callback(null, r);
    });
}

exports.getOldNewLogArray = getOldNewLogArray

function getOldNewLogArray (oldObject, newObject, arraykey)
{
    var oldArr = [];
    var newArr = [];
    if(Array.isArray(oldObject))
    {
        var idsOld = [];
        var idsNew = [];
        for (var i = 0; i < oldObject.length; i++) {
            if(typeof oldObject[i] == 'object')
            {
                if(arraykey == 'services')
                {
                    if(typeof oldObject[i].service_id  == 'object')
                    {
                        if(typeof oldObject[i].service_id._id == 'object')
                            idsOld.push(oldObject[i].service_id._id.toString());
                        else
                            idsOld.push(oldObject[i].service_id._id);
                    }
                    else
                    {
                        idsOld.push(oldObject[i].service_id)
                    }
                }
                else
                {
                    if(typeof oldObject[i]._id  == 'object')
                        idsOld.push(oldObject[i]._id.toString())
                    else
                        idsOld.push(oldObject[i]._id)
                }
                    
            }
        }
        for (var i = 0; i < newObject.length; i++) {
            if(typeof newObject[i] == 'object')
            {
                if(arraykey == 'services')
                {
                    if(typeof newObject[i].service_id == 'object')
                    {
                        if(typeof newObject[i].service_id._id == 'object')
                            idsNew.push(newObject[i].service_id._id.toString())
                        else
                            idsNew.push(newObject[i].service_id._id)
                    }
                    else
                    {
                        idsNew.push(newObject[i].service_id)
                    }
                }
                else
                {
                    if(typeof newObject[i]._id == 'object')
                        idsNew.push(newObject[i]._id.toString())
                    else
                        idsNew.push(newObject[i]._id)
                }
                    
            }
        }
        if(idsOld.length && idsNew.length)
        {
            if(idsOld.length > idsNew.length)
            {
                var diff = _.difference(idsOld, idsNew);
            }
            else
            {
                var diff = _.difference(idsNew, idsOld);
            }
        }
        else
        {
            if(oldObject.length > newObject.length)
            {
                var diff = _.difference(oldObject, newObject);
            }
            else
            {
                var diff = _.difference(newObject, oldObject);
            }
        }
        

        if(diff.length)
        {
            var obj = {};
            //obj[arraykey] = oldObject
            obj.key = arraykey;
            obj.value = oldObject
            oldArr.push(obj)

            var obj1 = {};
            //obj1[arraykey] = newObject
            obj1.key = arraykey;
            obj1.value = newObject
            newArr.push(obj1)
        }
    }
    else if(typeof oldObject == 'object')
    {
        for (var key in oldObject)
        {
            var keyexist=false;
            for (var key1 in newObject)
            {
                if(key == key1)
                {
                    keyexist = true;

                    if(oldObject[key] instanceof Date)
                    {
                        oldObject[key] = oldObject[key].toISOString()
                    }

                    if(Array.isArray(oldObject[key]))
                    {
                        var idsOld = [];
                        var idsNew = [];
                        for (var i = 0; i < oldObject[key].length; i++) {
                            if(typeof oldObject[key][i] == 'object')
                            {
                                idsOld.push(oldObject[key][i]._id.toString())
                            }
                        }
                        for (var i = 0; i < newObject[key1].length; i++) {
                            if(typeof newObject[key][i] == 'object')
                            {
                                idsNew.push(newObject[key1][i]._id.toString())
                            }
                        }
                        if(idsOld.length && idsNew.length)
                        {
                            if(idsOld.length > idsNew.length)
                            {
                                var diff = _.difference(idsOld, idsNew);
                            }
                            else
                            {
                                var diff = _.difference(idsNew, idsOld);
                            }
                        }
                        else
                        {
                            if(oldObject[key].length > newObject[key1].length)
                            {
                                var diff = _.difference(oldObject[key], newObject[key1]);
                            }
                            else
                            {
                                var diff = _.difference(newObject[key1], oldObject[key]);
                            }
                        }
                        

                        if(diff.length)
                        {
                            var obj = {};
                            //obj[key] = oldObject[key]
                            obj.key = key;
                            obj.value = oldObject[key]
                            oldArr.push(obj)

                            var obj1 = {};
                            //obj1[key1] = newObject[key1]
                            obj1.key = key1;
                            obj1.value = newObject[key1]
                            newArr.push(obj1)
                        }
                    }
                    else
                    {
                        if(oldObject[key] != newObject[key1])
                        {
                            var obj = {};
                            //obj[key] = oldObject[key]
                            obj.key = key;
                            obj.value = oldObject[key]
                            oldArr.push(obj)

                            var obj1 = {};
                            //obj1[key1] = newObject[key1]
                            obj1.key = key1;
                            obj1.value = newObject[key1]
                            newArr.push(obj1)
                        }
                    }
                }
                else
                {
                    if(!keyexist)
                    {
                        keyexist=false;
                    }
                }
            }

            if(!keyexist)
            {
                // removed key
                if(oldObject[key])
                {
                    var obj = {};
                    //obj[key] = oldObject[key]
                    obj.key = key;
                    obj.value = oldObject[key]
                    oldArr.push(obj)

                    var obj1 = {};
                    //obj1[key] = "none"
                    obj1.key = key1;
                    obj1.value = "none"
                    newArr.push(obj1)
                }
            }
        }

        //if new key added in new obhj
        for (var key in newObject)
        {
            var keyexist=false;
            for (var key1 in oldObject)
            {
                if(key == key1)
                {
                    keyexist = true;
                }
                else
                {
                    if(!keyexist)
                    {
                        keyexist=false;
                    }
                }
            }
            if(!keyexist)
            {
                if(oldObject[key])
                {
                    var obj = {};
                    //obj[key] = oldObject[key]
                    obj.key = key;
                    obj.value = oldObject[key]
                    oldArr.push(obj)

                    var obj1 = {};
                    //obj1[key] = "none"
                    obj1.key = key1;
                    obj1.value = "none"
                    newArr.push(obj1)
                }
            }
        }
    }

    
    var retobj = {};

    //check and convert to proper string
    retobj = checkKeyPair(oldArr, newArr)
    //end check and convert to proper string

    // retobj["newArr"] = newArr;
    // retobj["oldArr"] = oldArr
    return retobj;
}

function getGlobalLogKeyPair(){
    return JSON.parse(JSON.stringify(globalLogKeyPair));
}

function checkKeyPair (oldArr, newArr)
{
    var tempLogKeyPair = getGlobalLogKeyPair();
    for (var i = 0; i < oldArr.length; i++) {
        for (var j = 0; j < tempLogKeyPair.length; j++) {
            for(var key in tempLogKeyPair[j])
            {
                if( (key.trim()).toUpperCase() == (oldArr[i]["key"].trim()).toUpperCase() )
                {
                    oldArr[i]["key"] = tempLogKeyPair[j][key].trim();
                }
            }
        }
    }

    for (var i = 0; i < newArr.length; i++) {
        for (var j = 0; j < tempLogKeyPair.length; j++) {
            for(var key in tempLogKeyPair[j])
            {
                if( (key.trim()).toUpperCase() == (newArr[i]["key"].trim()).toUpperCase() )
                {
                    newArr[i]["key"] = tempLogKeyPair[j][key].trim();
                }
            }
        }
    }

    return {"newArr":newArr, "oldArr":oldArr}
}




