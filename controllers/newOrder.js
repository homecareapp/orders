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

var partnerShareTubeFlag = false;

function newOrder(params, callback) {
    if (!params) return callback(new Error("Data not found"));
    if (!params.provider_id) return callback(new Error("Provider ID not found"));
    if (!params.client_id) return callback(new Error("Client ID not found"));
    if (!params.partner_id) return callback(new Error("Partner ID not found"));
    if (!params.fromdate) return callback(new Error("fromdate not found"));
    if (!params.fromtime) return callback(new Error("fromtime not found"));
    // if (!params.createdbyname) return callback(new Error("createdbyname not found"));
    if (!params.ordertype) return callback(new Error("ordertype not found"));
    if (!params.servicedeliveryaddress) return callback(new Error("servicedeliveryaddress not found"));
    if (params.assignby && !params.assignto) return callback(new Error("Assignto not found"));

    if (params.pporder) {
        if (!params.pporder.services) return callback(new Error("Service not found"));
        if (!params.pporder.services.length) return callback(new Error("Service not found"));
    };

    

    function defaultLogistic() {
        return {
            delivertype: "DeliverToLab",
            username: "Deliver To Lab"
        }
    }

    if (params.logistic) {
        if (!params.logistic.delivertype) {
            params.logistic = defaultLogistic();
        }
    } else {
        params.logistic = defaultLogistic();
    }
    var parentOrderDate;
    var parentOrder;
    var today;

    partnerShareTubeFlag = false; //This is the flag which is used for whether partner has shared tube or not
    var tubes, orderId, tempNumber = new Number();

    var log = function() {
        params.log = [];
        var logobj = {};
        logobj.comments = "Visit Created";
        logobj["updatedby"] = params.loggedinuser
        logobj["updateddatetime"] = Date();
        params.log.push(logobj);
        return params.log;
    }

    var comments = function() {
        if (params.comment && params.comment.length) {
            params.comments = [];
            params.comments.push(params.comment);
            return params.comments;
        };
    }

    var groupID = function() {
        if (params.orderGroupId) return params.orderGroupId;
        params.orderGroupId = mongoose.Types.ObjectId().toString();
        return params.orderGroupId;
    }

    var statuslog = function() {
        params.statuslog = [];
        var statusLogObj = {
            status: params.status,
            statustimestamp: Date(),
            statusby: params.loggedinuser,
            coordinates: params.coordinates
        };

        params.statuslog.push(statusLogObj);
        return params.statuslog;
    }

    var statuslogpp = function() {
        params.statuslog = [];
        var statusLogObj = {
            status: 'Unassigned',
            statustimestamp: Date(),
            statusby: params.loggedinuser,
            coordinates: params.coordinates
        };

        params.statuslog.push(statusLogObj);
        return params.statuslog;
    }

    var serviceaddress = {
        _id: params.servicedeliveryaddress._id,
        address2: params.servicedeliveryaddress.address2,
        landmark: params.servicedeliveryaddress.landmark,
        area_id: params.servicedeliveryaddress.area_id
    }

    //PP Order Save
    var savePPOrder = function(next) {
        if (!params.pporder) return next(null);

        if (parentOrder) {
            if (parentOrder.status == "Completed") {
                if (moment(today).isAfter(parentOrderDate)) {
                    return next(null);
                }
            }
        }

        var paymentdetails = function() {
            if (params.pporder.paymentdetails) {
                return {
                    amount: tempNumber.makeFloat(params.pporder.paymentdetails.amount),
                    discount: tempNumber.makeFloat(params.pporder.paymentdetails.discount),
                    //paymentoption:params.pporder.paymentdetails.paymentoption,
                    paymentoption: params.paymentdetails.paymentoption,
                    paymentoptions: params.paymentdetails.paymentoptions,
                    reportdeliverymode: setPPReportdeliverymode(params.paymentdetails.reportdeliverymode)
                };
            };
        }

        var setPPReportdeliverymode = function(reportdeliverymode) {
            if (!reportdeliverymode) reportdeliverymode = [];
            reportdeliverymode.forEach(function(rptdeliObj) {
                if (rptdeliObj.charge) {
                    rptdeliObj.charge = 0;
                }
            });
            return reportdeliverymode
        }

        var orderObj = {
            partner_id: params.partner_id,
            provider_id: params.provider_id,
            client_id: params.client_id,
            fromdate: params.pporder.fromdate,
            todate: params.pporder.fromdate,
            fromtime: params.pporder.fromtime,
            totime: params.pporder.fromtime,
            comments: comments(),
            log: log(),
            statuslog: statuslogpp(),
            // assignto:       params.assignto,
            // assignby:       params.assignby,
            orderGroupId: groupID(),
            tubes: tubes,
            specialneedflag: params.specialneedflag,
            specialneed: params.specialneed,
            createdby:params.loggedinuser._id,
            createdbyname: params.loggedinuser.profile.name,
            ordertype: "PP",
            paymentdetails: paymentdetails(),
            services: params.pporder.services,
            // status:         params.status,
            status: "Unassigned",
            parentorder_id: orderId,
            source: params.source,
            droppointaddress: params.droppointaddress,
            servicedeliveryaddress: serviceaddress
        }

        var order = Model(orderObj);
        order.save(function(e, orderResult) {
            if (e) return next(e);
            if (!orderResult) return next(new Error("Order not saved"));
            return next(null);
        });
    }

    // save main order 
    var saveOrder = function(next) {

        var paymentdetails = {
            amount: tempNumber.makeFloat(params.paymentdetails.amount),
            discount: tempNumber.makeFloat(params.paymentdetails.discount),
            paymentoption: params.paymentdetails.paymentoption,
            paymentoptions: params.paymentdetails.paymentoptions,
            orderDiscount: params.paymentdetails.orderDiscount,
            reportdeliverymode: params.paymentdetails.reportdeliverymode
        }

        var orderObj = {
            partner_id: params.partner_id,
            provider_id: params.provider_id,
            client_id: params.client_id,
            fromdate: params.fromdate,
            todate: params.fromdate,
            fromtime: params.fromtime,
            totime: params.fromtime,
            comments: comments(),
            log: log(),
            statuslog: statuslog(),
            assignto: params.assignto,
            assignby: params.assignby,
            orderGroupId: groupID(),
            tubes: tubes,
            specialneedflag: params.specialneedflag,
            specialneed: params.specialneed,
            createdby:params.loggedinuser._id,
            createdbyname: params.loggedinuser.profile.name,
            ordertype: params.ordertype,
            paymentdetails: paymentdetails,
            services: params.services,
            status: params.status,
            source: params.source,
            parentorder_id: params.parentorder_id,
            addpatientcomment: params.addpatientcomment,
            droppointaddress: params.droppointaddress,
            servicedeliveryaddress: serviceaddress,
            logistic: params.logistic
        }

        var order = Model(orderObj);
        order.save(function(e, orderResult) {
            if (e) return next(e);
            if (!orderResult) return next(new Error("Order not saved"));
            orderId = orderResult._id;
            return next(null);
        });
    }


    // update client incase specialneed
    var clientUpdate = function(next) {
        params.specialneedflag = true; //DEFAULT TRUE
        if (!Array.isArray(params.specialneed)) params.specialneed = [];
        if (!params.specialneed.length) params.specialneedflag = false;

        var updateParams = {
            specialneeds: params.specialneed
        };

        ModelClient.update({ _id: params.client_id }, { $set: updateParams }, function(e, r) {
            return next(null);
        });
    }

    var getParentOrder = function(next) {
        if (params.currentparent_id) {

            Model.findById(params.currentparent_id, { status: 1, fromdate: 1 }, { lean: true }, function(e, r) {
                if (e) return next(e);
                parentOrder = r;
                today = moment().tz(TIMEZONE).startOf('day').toISOString();
                parentOrderDate = moment(parentOrder.fromdate).tz(TIMEZONE).startOf('day').toISOString();
                if (parentOrder.status != "Completed") {
                    if (moment(today).isAfter(parentOrderDate)) {
                        return next(new Error("Cannot create Order from Backdated Orders Which are not Delivered "));
                    } else
                        return next(null);
                } else {
                    if (!params.addpatientcomment) {
                        params.addpatientcomment = {};
                    }
                    if (!params.addpatientcomment.addpatientreasons) {
                        params.addpatientcomment.addpatientreasons = [];
                    }
                    if (params.addpatientcomment.addpatientreasons.length)
                        return next(null);
                    else
                        return next(new Error("Add Patient Comments is compulsory when Parent order is Delivered "));
                }
            });
        } else
            return next(null);
    }

    async.waterfall([getParentOrder, clientUpdate, saveOrder, savePPOrder], function(e) {
        if (e) return callback(e);

        getbyid.getById(orderId, function(e, order) {
            if (e) return callback(e);

            return callback(null, order);
        });
    })
};

exports.newOrder = newOrder;