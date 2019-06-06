var Model = require('../models/Address');
var ModelArea = require('../models/Area');
var ModelPartner = require('../models/Partner');
var ModelOrder = require('../models/Order');
var mongoose = require('mongoose');
var mongoosePaginate = require("mongoose-paginate");
var async = require('async');
var _ = require("lodash");

var populate = [
    { path:'city_id',select:'name'}
]
var populatePartner = [
    { path:'areas.area_id',select:'_id pincodes name'}
]

exports.addAddress = add;

exports.addUpdateAddresses = addUpdateMultiAddress;

exports.addAddresses = addMultipleAddress;

exports.getAddresses = getAddressesByIds;

exports.updateAddress = update;

exports.getAddress2 = concatAddress;

function add(params, callback){
    // if(!params.area_id) return callback("area_id is missing");
    if(!params.partner_id) return callback("partner_id is missing");
    if(!params.city_id) return callback("city_id is missing");
    if(!params.sublocation_text) return callback("sublocation_text is missing");
    if(!params.googleplace_id) return callback("googleplace_id is missing");
    if(!params.pincode) return callback("pincode is missing");
    if(!params.landmark) return callback("landmark is missing");
    if(!params.title) return callback("title is missing");

    if (params.area_id) delete params.area_id;
    params.address2 = concatAddress(params);

    var addr = new Model(params);
    addr.save(function(e,r){
        if(e) return callback(e);
        return callback(null,r);
    });
}

function update(params, callback){
    if(!params._id) return callback("_id is missing");
    if(!params.partner_id) return callback("partner_id is missing");
    if(!params.city_id) return callback("city_id is missing");
    if(!params.sublocation_text) return callback("sublocation_text is missing");
    //if(!params.googleplace_id) return callback("googleplace_id is missing");
    if(!params.pincode) return callback("pincode is missing");
    if(!params.landmark) return callback("landmark is missing");
    if(!params.title) return callback("title is missing");

    params.address2 = concatAddress(params);
    Model.update({_id:params._id}, {$set:params}, function (e,a) {
        if(e) return callback(null);
        return callback(null);
        // if(!params.area_id) return callback(null);
        // if(typeof params.area_id == "object") return callback(null);

        // ModelArea.findById(params.area_id, {name:1}, {lean:true}, function(e,r){
        //     return callback(null, r);
        // });
    })
}

function concatAddress(params){
    var fulladdress = '';

    if(params.wing) fulladdress = fulladdress.concat("WING: ",params.wing, ", ");
    if(params.flatno) fulladdress = fulladdress.concat("FLAT NO: ",params.flatno, ", ");
    if(params.floor) fulladdress = fulladdress.concat("FLOOR: ", params.floor, ", ");
    if(params.building) fulladdress = fulladdress.concat("BUILDING: ",params.building, ", ");
    if(params.plotno) fulladdress = fulladdress.concat("PLOT NO: ", params.plotno, ", ");
    if(params.sectorno) fulladdress = fulladdress.concat("SECTOR NO: ", params.sectorno, ", ");
    if(params.streetname) fulladdress = fulladdress.concat("STREET: ",params.streetname, ", ");
    if(params.sublocation_text) fulladdress = fulladdress.concat(params.sublocation_text, ", ");
    
    return fulladdress.substring(0,fulladdress.lastIndexOf(", "));   
}

//check the use if on ly in migration
function addMultipleAddress(params,callback){
    function inputParam(address){
        address.partner_id = params.partner_id
        return address;
    }

    function addressId(id){
        return {
            _id:id
        };
    }

    var addressIds = [];

    async.each(params.addresses, function(address, nextRow){
        add(inputParam(address), function (e,a) {
            if(e) return nextRow();

            addressIds.push(addressId(a._id));
            return nextRow();          
        });
    },function(error){
        if(error) return callback(error);

        return callback(null, addressIds);
    });
}


function addUpdateMultiAddress(params, callback) {
    if(!params.addresses) return callback("no address found");
    if(!params.addresses.length) return callback(null);
    var action, addressIds = [];

    function addressId(id){
        return {
            _id:id
        };
    }

    // each method to update address
    function updateAddr(address, nextRow) {
        update(address, function (e,a) {
            if(e) return nextRow(null);
            
            addressIds.push(addressId(address._id));

            //to do update orders address2 and area_id with the new one.

            // updateOrdersAddress(address,function(e){
            //     if(e) return nextRow(e);
            //     return nextRow(null);
            // })

            return nextRow(null);
        })
    };

    function updateOrdersAddress(address, callback)
    {
        //find all orders with same address._id and then update its address2 and area_id

        var search = {
            "servicedeliveryaddress._id":address._id,
            "$and":[{"status":{$ne:'Cancelled'}},{"status":{$ne:'Completed'}}]
        };


        ModelOrder.find(search,{},{lean:1}, function (e,orders) {
            async.each(orders, function(ord, nextRow){
                ord.servicedeliveryaddress.address2 = address.address2;
                ord.servicedeliveryaddress.area_id = address.area_id;
                return nextRow()
            },function(error){
                if(error) return callback(error);

                return callback(null);
            });
        })
    }

    // each method to update address
    function addAddress(address, nextRow){
        add(address, function (e,a) {
            if(e) return nextRow(null);

            addressIds.push(addressId(a._id));
            return nextRow(null);
        });
    }

    async.each(params.addresses, function(address, nextRow){
        // addOrUpdate(address);
        address.partner_id = params.partner_id;
        (!address._id) ? addAddress(address, nextRow) : updateAddr(address, nextRow);
    },function(error){
        if(error) return callback(error);

        return callback(null, addressIds);
    });
}

function getAddressesByIds(params ,callback){
    if(!params.ids || typeof params.ids != "object") return callback("address ids not found");
    if(!params.ids.length) return callback(null, []);
    var addresses, finalAddress=[], areas;
    
    var getAddresses = function(next) {
        Model.find({_id:{$in:params.ids}},{},{lean:1}, function (e,a) {
            if(e) return next(e);
            addresses = a;
            return next(null);
        }).populate(populate)
    }



    var getPartnerAreas = function(next){
        ModelPartner.findById(params.partner_id, {"areas.area_id":1}, {lean:true}, function (e,p) {
            if(e) return next(e);
            areas = p.areas;
            return next();
        }).populate(populatePartner)
    }
    
    var getAreaForAddress = function(next){
        addresses.forEach(function(addr){
            delete addr.area_id; //incase area_id come from ui
            function makeObj(area){
                if(area){
                    //delete area.area_id.pincodes;        
                    return _.extend(addr,area);
                }
                else
                    return addr;
            }

            // var addrObj = makeObj(_.find(areas, function(area){
            //     return _.findIndex(area.area_id.pincodes, function(p){ return p == addr.pincode;})>-1 ? true:false;
            // }));
            var addrObj = makeObj(getAreaByPincode(addr.pincode));

            if(addrObj) finalAddress.push(addrObj);

        });
        return next();
    }

    function getAreaByPincode(pincode){
        for (var i = 0; i < areas.length; i++) {            
            if(_.findIndex(areas[i].area_id.pincodes, function(p){ return p == pincode;})>-1) return areas[i];
        }
        return null;
    }

    async.waterfall([getAddresses, getPartnerAreas, getAreaForAddress],function(error){ 
        if(error) callback(error); 
        
        return callback(null, finalAddress);});
}