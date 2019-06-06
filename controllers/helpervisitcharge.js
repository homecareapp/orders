var mongoose = require('mongoose');
var async = require('async');
var mongoosePaginate = require('mongoose-paginate');
var Model = require('../models/Order');
var ModelPartner = require('../models/Partner');
var _ = require("lodash");
var moment = require("moment");

exports.calculateVisitCharge = function(group_id, order_date, order_time, partner_id, callback) {
    if (!group_id) return callback("send group id");
    if (!partner_id) return callback("send partner id");
    if (!order_date) return callback("send order_date");
    var params = {
        ordergroupid:   group_id,
        fromdate:       order_date,
        partner_id:         partner_id,
        fromtime:       order_time
    }

    var finalVisitCharge = 0, orders = [], completedOrders = [],groupedOrders=[], partnerVisitChargeList;

    var getOrders = function(next){        
        getOrdersByGroupId(params.ordergroupid, function(e,r){
            if(e) return next(e);
            orders = orders.concat(r);
            // filter orders based on status = SampleCollected || Completed || SampleHandover
            completedOrders = filterOrder(orders);
            groupedOrders = grpOrderByTimeAndAddress(orders);
            return next(null);
        });                
    }

    var getPartner = function(next) {
        getPartnerById(params.partner_id, function(e,p){
            if(e) return next(e);
            partnerVisitChargeList = p.visitcharges;
            return next(null);
        });
    }

    var calVC = function() {
        var charges = calFastingAndPPVisitCharge(groupedOrders, partnerVisitChargeList); //it will return fasting visiting and ppvisiting charge
        charges.collectedVisitCharge = calCompletedVisitCharge(completedOrders);
        charges.totalVisitCharges = charges.fastingVisitsCharge + charges.ppVisitCharge - charges.collectedVisitCharge;
        return charges;
    }

    async.waterfall([getOrders, getPartner], function(err){
        if(err) return callback(err);

        return callback(null, calVC())
    });
};

exports.newOrderCalculateVisitCharge = function(params, callback) {
    if(!params.fromtime && parseInt(params.fromtime != 0)) return callback("visit time missing");
    if(!params.fromdate) return callback("visit date missing");
    if(!params.action) return callback("action missing"); //default add
    if(!params.partner_id) return callback("partner_id missing"); 
    if(!params.pptestflage) params.pptestflage = false;
    if(params.pptestflage) {
        if(!params.ppfromtime && parseInt(params.ppfromtime != 0)) return callback("pp visit time missing");
        if(!params.ppfromdate) return callback("pp visit date missing");
    }
    // if(!params.services) params.services = [];
    var finalVisitCharge = 0, orders = [], completedOrders = [],groupedOrders=[], partnerVisitChargeList;

    var getOrders = function(next){
        makeOrderObj("F") // incase of action == add DONOTDELETE
        if(params.pptestflage) makeOrderObj("PP", params.ppfromtime,params.ppfromdate)
        if(!params.ordergroupid) {
            groupedOrders = grpOrderByTimeAndAddress(orders);
            return next(null);
        }
        else {
            getOrdersByGroupId(params.ordergroupid, function(e,r){
                if(e) return next(e);
                orders = orders.concat(r);
                // filter orders based on status = SampleCollected || Completed || SampleHandover
                completedOrders = filterOrder(orders);
                groupedOrders = grpOrderByTimeAndAddress(orders);
                return next(null);
            });
        }        
    }

    function makeOrderObj(ordertype, time, date){
        if(!time) time = params.fromtime;
        if(!date) date = params.fromdate;
        if(params.action == "add"){
            orders.push({
                servicedeliveryaddress: {_id:params.servicedeliveryaddress_id},
                ordertype:              ordertype,
                fromtime:               time,
                fromdate:               date,
                status:                 "Unassigned" 
            });
        }        
    }

    var getPartner = function(next) {
        getPartnerById(params.partner_id, function(e,p){
            if(e) return next(e);
            // partnerVisitChargeList = filterVisitChargeByDate(p.visitcharges, params.fromdate);
            partnerVisitChargeList = p.visitcharges;
            return next(null);
        });
    }

    var calVC = function() {
        var charges = calFastingAndPPVisitCharge(groupedOrders, partnerVisitChargeList); //it will return fasting visiting and ppvisiting charge
        charges.collectedVisitCharge = calCompletedVisitCharge(completedOrders);
        charges.totalVisitCharges = charges.fastingVisitsCharge + charges.ppVisitCharge - charges.collectedVisitCharge;
        return charges;
    }

    async.waterfall([getOrders, getPartner], function(err){
        if(err) return callback(err);

        return callback(null, calVC())
    });
}

function getOrdersByGroupId (ordergroupid, callback) {
    var search = {
        orderGroupId: ordergroupid,
        status: {$ne:"Cancelled"}
    };
    Model.find(search,{"servicedeliveryaddress._id": 1, ordertype:1, status:1, fromtime:1, fromdate:1, paymentdetails:1}, 
        {lean:true}, function (error, ords) {
        if(error) return callback("error while finding order by orderGroupId: " + error);
        ords.forEach(function(o){
            o.fromdate = o.fromdate.toISOString();
        });
        return callback(null, ords);
    });                
}

function getPartnerById(id, callback) {
    if(!id) return callback("partner_id missing");

    ModelPartner.findById(id, {paymentdetails:1, visitcharges: 1},{lean:true}, function (error, partner) {
        if(error) return callback(error);

        return callback(null, partner);
    });
}

function filterOrder (orders) {
    return _.filter(orders, function (o) {
        return o.status == "SampleCollected" || o.status == "Completed" || o.status == "SampleHandover"
    });
}

function grpOrderByTimeAndAddress(orders) {
    return _.groupBy(orders, function (order) {
        return [order.fromtime, order.servicedeliveryaddress._id, order.fromdate]
    }); 
}

function filterVisitChargeByDate(visitcharges, date) {
    var day = moment(date).add("minute",330).format("dddd").toLowerCase();
    return visitcharges.filter(function (v) {
        if (_.findIndex(v.day,function (d) {return d.toLowerCase() == day;})!=-1) {
            return true;
        }
        else return false;
    });
}

function calFastingAndPPVisitCharge(grpOrders, prtVC) {
    var result = { fastingVisitsCharge: 0, ppVisitCharge: 0}
    for (var key in grpOrders) {
        var vcObj = getVCByTime(prtVC, grpOrders[key][0].fromdate, grpOrders[key][0].fromtime);
        
        //if order type F visit
        if (_.findIndex(grpOrders[key], function (o) { return o.ordertype == "F" }) > -1) {
            if(vcObj && vcObj.person!=undefined && vcObj.charge!=undefined) result.fastingVisitsCharge = result.fastingVisitsCharge + Math.ceil(grpOrders[key].length/vcObj.person)*vcObj.charge;
        }
        //if order type == PP 
        else if(_.findIndex(grpOrders[key], function (o) { return o.ordertype == "PP" }) > -1){        
            if(vcObj && vcObj.person!=undefined && vcObj.postcharge!=undefined) result.ppVisitCharge = result.ppVisitCharge + Math.ceil(grpOrders[key].length/vcObj.person)*vcObj.postcharge;
        };                
    }
    return result;
}

function getVCByTime(visitcharges, date, time){
    var prtVC = filterVisitChargeByDate(visitcharges, date);
    if(!prtVC) prtVC = [];
    return _.find(prtVC, function (vc) { 
        if(vc.from < vc.to)
            return time >= vc.from && (time <= vc.to || time <= parseInt(vc.to) + 30)
        else
            return (time >= vc.from && time <= 1380) || (time >= 0 && time <= vc.to)
    });
}

function calCompletedVisitCharge(cpldOrders) {
    var collectedVisitCharge = 0;
    // calculating completed visit charge;
    cpldOrders.forEach(function (o) {
        if (o.paymentdetails.visitingcharges)
            collectedVisitCharge = collectedVisitCharge + parseInt(o.paymentdetails.visitingcharges)
    });
    return collectedVisitCharge;
}