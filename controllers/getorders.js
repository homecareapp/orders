var mongoose = require('mongoose');
var async = require('async');
var Model = require('../models/Order');
var ModelPartner = require('../models/Partner');
var ModelAddress = require('../models/Address');
var ModelUser = require('../models/User');

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

var populateList = [
    {
        path: 'assignto',
        select: '_id profile.name profile.mobilenumber'
    },
    {
        path: 'logistic.logistic_id',
        select: '_id profile.name profile.mobilenumber'
    },
    {
        path: 'client_id',
        select: 'demography externalId'
    },
    {
        path: 'partner_id',
        select: '_id info.name info.acronym info.code'
    },
    {
        path: 'services.service_id',
        select: 'name _id'
    },
    {
        path: 'log.updatedby',
        select: '_id profile.name'
    }
]

function getOrder(params, callback) {

    var search = {};
    var option = {
        page: params.page,
        limit: parseInt(params.limit)
    }
    if (!params.loggedinuser.provider_id) return callback(new Error("No Provider_id Assigin To This User"));
    if (params.loggedinuser.userinfo.partners) {
        // console.log(params.loggedinuser.userinfo.partners.length);
        if (params.loggedinuser.userinfo.partners.length > 0) {
            var tempArray = []
            async.eachSeries(params.loggedinuser.userinfo.partners, function(partner, nextpartner) {
                tempArray.push(partner._id)
                return nextpartner()
            }, function(error) {
                search["partner_id"] = {
                    $in: tempArray
                }
            })
        }
    }
    if (params.loggedinuser.provider_id) {
        search["provider_id"] = params.loggedinuser.provider_id._id;
    };
    if (params.loggedinuser._id && params.loggedinuser.role == "serviceagent") {
        search["assignto"] = params.loggedinuser._id;
    }
    if (params.loggedinuser._id && params.loggedinuser.role == "logistic") {
        search["logistic.logistic_id"] = mongoose.Types.ObjectId(params.loggedinuser._id);
    }


    if (params.partner_id) // string comma seperated
    {
        var partners = [];
        if (params.partner_id) {
            partners = params.partner_id.split(',')
        }
        if (partners.length) {
            for (var i = 0; i < partners.length; i++) {
                partners[i] = mongoose.Types.ObjectId(partners[i]);
            }
            search["partner_id"] = {
                $in: partners
            }
        }
    }
    if (params.area_id) {
        search["area_id"] = params.area_id;
    };
    // if (params.client_id) {
    //     search["client_id"] = params.client_id;
    // }

    if (params.client_id) // string comma seperated
    {
        var clients = [];
        if (params.client_id) {
            clients = params.client_id.split(',')
        }
        if (clients.length) {
            search["client_id"] = {
                $in: clients
            }
        }
    }

    if (params.staff_id) // string comma seperated
    {
        var staffs = [];
        if (params.staff_id) {
            staffs = params.staff_id.split(',')
        }
        if (staffs.length) {
            for (var i = 0; i < staffs.length; i++) {
                staffs[i] = mongoose.Types.ObjectId(staffs[i]);
            }
            search["assignto"] = {
                $in: staffs
            }
        }
    }

    if (params.logistic_id) // string comma seperated
    {
        var logistics = [];
        if (params.logistic_id) {
            logistics = params.logistic_id.split(',')
        }
        if (logistics.length) {
            for (var i = 0; i < logistics.length; i++) {
                logistics[i] = mongoose.Types.ObjectId(logistics[i]);
            }
            search["logistic.logistic_id"] = {
                $in: logistics
            }
        }
    }

    if (params.createdby_id) // string comma seperated
    {
        var createdbyids = [];
        if (params.createdby_id) {
            createdbyids = params.createdby_id.split(',')
        }
        if (createdbyids.length) {
            for (var i = 0; i < createdbyids.length; i++) {
                createdbyids[i] = mongoose.Types.ObjectId(createdbyids[i]);
            }
            search["log.0.updatedby"] = {
                    $in: createdbyids
                }
                //search["log.comments"] = "Visit Created"
        }
    }

    if (params.logisticstatus) {
        var logisticstatus = [];
        if (params.logisticstatus) {
            logisticstatus = params.logisticstatus.split(',')
        }
        if (logisticstatus.length) {
            search["logistic.status"] = {
                $in: logisticstatus
            }
        }
    }



    if (params.status) {

        var status = [];
        if (params.status) {
            status = params.status.split(',')
        }
        if (status.length) {
            search["status"] = {
                $in: status
            }
        }

        //search["status"] = params.status;
    } else if (!params.status) {
        if (params.loggedinuser._id) {
            if (params.loggedinuser.role == "admin" ||
                params.loggedinuser.role == "providerteamlead" || params.loggedinuser.role == "providerfrontoffice") {
                search["status"] = { $ne: "Cancelled" }
            }
        }
    }
    if (params.fromdate && params.todate) {
        var fdate = new Date(params.fromdate);
        var tdate = new Date(params.todate);
        //tdate.setDate(tdate.getDate() + 1);
        //tdate.setSeconds(tdate.getSeconds() - 1);
        search["fromdate"] = {
            $gte: fdate.toUTCString(),
            $lte: tdate.toUTCString()
        };
    } else if (params.fromdate) {
        var fdate = new Date(params.fromdate);
        var tdate = new Date(fdate);
        tdate.setDate(tdate.getDate() + 1);
        tdate.setSeconds(tdate.getSeconds() - 1);
        search["fromdate"] = {
            $gte: fdate.toUTCString(),
            $lte: tdate.toUTCString()
        };
    };

    if (params.fromdate && params.fromtime && params.totime) {
        search["fromtime"] = {
            $gte: tempNumber.makeFloat(params.fromtime),
            $lt: tempNumber.makeFloat(params.totime)
        };
    };

    if (params.orderGroupId) {
        search["orderGroupId"] = params.orderGroupId;
    }

    var sort = 1;
    var sortfield = "fromtime";
    async.waterfall([
            /**[sort data by date]*/
            function(nextfun) {
                if (params.sort) {
                    if (params.sort == "asc") {
                        sort = 1;
                    } else {
                        sort = -1;
                    }
                }
                option.sortBy = {};
                option.sortBy[sortfield] = sort;
                nextfun(null);
            },
            function(nextfun) {
                if (!params.clientsearch && !params.firstname && !params.middlename && !params.lastname) {
                    return nextfun(null);
                }
                var searchPatient = {};
                if (params.clientsearch) {
                    searchPatient['$or'] = [{
                        'demography.mobilenumber': new RegExp(params.clientsearch, 'i')
                    }, {
                        'clientcode': new RegExp(params.clientsearch, 'i')
                    }, {
                        'externalId': new RegExp(params.clientsearch, 'i')
                    }, {
                        "demography.altnumber": new RegExp(params.clientsearch, 'i')
                    }];
                }
                if (params.firstname) {
                    searchPatient['demography.firstname'] = new RegExp(params.firstname, 'i')
                }
                if (params.middlename) {
                    searchPatient['demography.middlename'] = new RegExp(params.middlename, 'i')
                }
                if (params.lastname) {
                    searchPatient['demography.lastname'] = new RegExp(params.lastname, 'i')
                }

                ModelClient.find(searchPatient, '_id', function(error, result) {
                    var tempArray = [];
                    if (error) return nextfun(error);
                    if (result) {
                        search["client_id"] = {
                            "$in": result
                        };
                        return nextfun(null);
                    }
                });
            },
            function(nextfun) {
                if (!params.createdbyrole) {
                    return nextfun(null);
                }

                if (params.createdby_id) {
                    return nextfun(null);
                }

                var createdbyrole = [];
                var searchUser = {};
                if (params.createdbyrole) {
                    createdbyrole = params.createdbyrole.split(',')
                }
                if (createdbyrole.length) {
                    searchUser["role"] = {
                        $in: createdbyrole
                    }
                }
                ModelUser.find(searchUser, '_id', function(error, result) {
                    var tempArray = [];
                    if (error) return nextfun(error);
                    if (result) {
                        search["log.0.updatedby"] = {
                            "$in": result
                        };
                        return nextfun(null);
                    }
                });
            },
            function(nextfun) {
                if (params.partner_id) {
                    return nextfun(null);
                }
                if (!params.partnertype) {
                    return nextfun(null);
                }


                if (params.loggedinuser.userinfo.partners && params.loggedinuser.userinfo.partners.length) {
                    var tempArray = [];
                    params.loggedinuser.userinfo.partners.forEach(function(partObj) {
                        if (params.partnertype == 'b2b') {
                            if (partObj.partnertype == 'b2b' || !partObj.partnertype) {
                                tempArray.push(partObj._id)
                                search["partner_id"] = {
                                    $in: tempArray
                                }
                            }
                        } else {
                            if (partObj.partnertype == 'b2c') {
                                tempArray.push(partObj._id)
                                search["partner_id"] = {
                                    $in: tempArray
                                }
                            }
                        }
                    })
                    return nextfun(null);
                } else {
                    var searchPartner = {};
                    //searchPartner['partnertype'] = params.partnertype
                    if (params.partnertype == 'b2b') {
                        searchPartner['$or'] = [{
                            'partnertype': params.partnertype
                        }, {
                            'partnertype': null
                        }];
                    } else {
                        searchPartner["partnertype"] = params.partnertype;
                    }
                    PartnerModel.find(searchPartner, '_id', function(error, result) {
                        var tempArray = [];
                        if (error) return nextfun(error);
                        if (result) {
                            search["partner_id"] = {
                                "$in": result
                            };
                            return nextfun(null);
                        }
                    });
                }
            }
        ],
        function(error) {
            if (error) return callback(error);

            if (!params.page && !params.limit) {
                var optionsort = {}
                var pr = { client_id: 1, services: 1, partner_id: 1, assignto: 1, fromtime: 1, fromdate: 1, status: 1, ordertype: 1, servicedeliveryaddress: 1, servicetime: 1, logistic: 1, droppointaddress: 1 }
                if (params.loggedinuser._id) {
                    if (params.loggedinuser.role == "serviceagent" || params.loggedinuser.role == "partnerfrontoffice" || params.loggedinuser.role == "partnerteamlead")
                        optionsort.sort = { 'fromtime': sort }
                }
                if (params.loggedinuser._id && params.loggedinuser.role == "logistic") {
                    optionsort.sort = { 'logistic.pickuptime': sort }
                }
                Model.find(search, pr, optionsort, function(error, result) {
                    if (error) return callback(error);

                    return callback(null, { response: result });

                }).populate(populateList);
            } else {
                option.populate = populateList;
                option.columns = 'client_id services partner_id assignto fromtime fromdate status ordertype servicedeliveryaddress servicetime logistic droppointaddress log';

                /*
                option.select = "-signature -prescriptions";
                console.log(option);
                */
                Model.paginate(search, option, function(error, paginatedResults, pageCount, itemCount) {
                    if (error) return callback(error);

                    return callback(null, {
                        response: paginatedResults,
                        pageCount: pageCount,
                        itemCount: itemCount
                    });

                });
            }
        });
};

function getOrderlist(params, callback){
    var searchOrder = {}, searchPartner = {}, searchUser = {}, searchPatient = {}, clientIds=[],
        orders = [], partners = [], phlebos = [], logistics = [], createdbyrole=[], createdbyroles=[],
        createdBy = [], page, items;

    function getUsers(next){
        if(params.userlist != "true" && !params.createdbyrole ) return next(null)
        searchUser._Deleted = false;

        if (params.city_id) searchUser['profile.city_id'] = params.city_id
        if (params.createdbyrole) { createdbyrole = params.createdbyrole.split(',') }
        // if (createdbyrole.length) { searchUser["role"] = { $in: createdbyrole} }

        ModelUser.find(searchUser,{"profile.name":1, "userinfo.partners":1, role:1,username:1},{lean:true}, function(error, userresult) {
            phlebos = _.filter(userresult, function(user)
            {
                if (user.role == "serviceagent")
                return user
            });
            logistics = _.filter(userresult, function(user)
            {
                if (user.role == "logistic")
                return user
            });
            createdBy = _.filter(userresult, function(user)
            {
                if (user.role == "admin" ||user.role == "serviceagent" || user.role =="providerteamlead" || user.role =="partnerfrontoffice" || user.role =="partnerteamlead")
                return user
            });
            userresult.forEach( function(obj) {
                createdbyrole.forEach( function(objone) {
                    if(obj.role == objone){
                        createdbyroles.push(obj);
                    }
                });
            });
            return next(null);
        }).populate([
        {
            path: 'userinfo.partners',
            select: '_id'
        }
        ]);
    }

    function getPartners(next){
        // if(params.partnerlist != "true") return next(null)

        // searchPartner._Deleted = false;
        if(params.partnertype == "b2b")
            searchPartner = {
                "$or": [{"partnertype":null}, {"partnertype": params.partnertype}]
            }
        if (params.partnertype == "b2c")
            searchPartner.partnertype = params.partnertype;
        searchPartner._Deleted = false;
        if (params.city_id) searchPartner['info.city_id'] = params.city_id;

        if (params.loggedinuser.role == "providerteamlead") {
            
            partners = params.loggedinuser.userinfo.partners.map(function(p){
                return {
                    _id: p._id,
                    _Deleted: p._Deleted,
                    partnertype: p.partnertype,
                    info:{
                        name:p.info.name
                    }
                }
            })
            partners = _.filter(partners, function(b){return b._Deleted == false})
            if (params.partnertype == "b2b") {
                partners = _.filter(partners, function(b){return b.partnertype == "b2b"})
            }else if(params.partnertype == "b2c") {
                partners = _.filter(partners, function(b){return b.partnertype == "b2c"})
            }
            return next(null);
        }else {
            ModelPartner.find(searchPartner,{"info.name":1},{lean:true}, function(error, partnerresult) {            
                partners = partnerresult;           
                return next(null);
            });            
        }
    }

    function getOrders(next){
        var option = {
            page: params.page,
            limit: parseInt(params.limit),
            populate:populateList,
            columns:`client_id services partner_id assignto 
                    fromtime fromdate status ordertype servicedeliveryaddress orderGroupId
                    servicetime logistic droppointaddress log discountupdatecomment.discountupdatereason addpatientcomment.addpatientreasons serviceupdatecomment.testupdatereason visitcomments`
        }
        sortOrders();
        makeSearchOrderObject();
        if(params.page && params.limit){
            Model.paginate(searchOrder, option, function(error, paginatedResults, pageCount, itemCount) {
                if (error) return next(error);
                orders=paginatedResults;
                // var groupingorders = _.groupBy(paginatedResults, function(o) { return [o.fromtime,o.orderGroupId,o.client_id._id] } );
                // groupingids = _.keys(groupingorders)
                // groupingids.forEach(function(i){ groupingorders[i].forEach(function(o){ orders.push(o) }) })

                page = pageCount;
                items = itemCount;
                return next(null);
            });
        }
        else return next("Paging params not found");
        function sortOrders(){
            var sort ;
            var sortfield = "fromtime";
            if (params.sort) {
                    if (params.sort == "asc") {
                        sort = 1;
                    } else if(params.sort == "desc") {
                        sort = -1;
                    }
                }
                option.sortBy = {};
                option.sortBy[sortfield] = sort;
                // option.sortBy["orderGroupId"] = 1;
        }
    }

    function getClients(next) {
        if (!params.clientsearch && !params.firstname && !params.middlename && !params.lastname) {
            return next(null);
        }else {
            makeSearchClientObject();
            ModelClient.find(searchPatient, {"_id":1},{lean:true}, function(error, result) {
                if (error) return next(error);
                clientIds = result;
                return next(null);
            });
        }

        function makeSearchClientObject() {
            if (params.clientsearch) {
                    searchPatient['$or'] = [{
                        'demography.mobilenumber': new RegExp(params.clientsearch, 'i')
                    }, {
                        'clientcode': new RegExp(params.clientsearch, 'i')
                    }, {
                        'externalId': new RegExp(params.clientsearch, 'i')
                    }, {
                        "demography.altnumber": new RegExp(params.clientsearch, 'i')
                    }];
                }
                if (params.firstname) {
                    searchPatient['demography.firstname'] = new RegExp(params.firstname, 'i')
                }
                if (params.middlename) {
                    searchPatient['demography.middlename'] = new RegExp(params.middlename, 'i')
                }
                if (params.lastname) {
                    searchPatient['demography.lastname'] = new RegExp(params.lastname, 'i')
                }
        }
    }

    function makeSearchOrderObject(){
        searchOrder.fromdate = params.fromdate;
        if(!params.fromdate) searchOrder.fromdate = new Date();

        searchOrder.provider_id =  params.loggedinuser.provider_id._id;
        //default partner search
        searchOrder.partner_id= {
            "$in": partners
        };
        if(createdbyroles.length > 0)searchOrder["log.0.updatedby"]= { "$in": createdbyroles};
        //client search
        if(clientIds.length)
            searchOrder.client_id = { "$in": clientIds };
        else if (params.clientsearch || params.firstname || params.middlename || params.lastname) 
            searchOrder.client_id = { "$in": clientIds };


        makeInSearch(); // for phlebo,partner,logistic,createdby,status, logsticStatus
                
        //to make search order object for partners, phlebo, logistic,createdby,status, logsticStatus
        function makeInSearch(field){
            if(params.staff_id)
                searchOrder.assignto = splitIdsAndIn(params.staff_id);
            if(params.partner_id) //when partner list coming from UI
                searchOrder.partner_id = splitIdsAndIn(params.partner_id);
            if(params.logistic_id)
                searchOrder["logistic.logistic_id"] = splitIdsAndIn(params.logistic_id);
            if(params.createdby_id)
                searchOrder["log.0.updatedby"] = splitIdsAndIn(params.createdby_id);
            if(params.logisticstatus)
                searchOrder["logistic.status"] = splitIdsAndIn(params.logisticstatus);
            if(params.status)
                searchOrder.status = splitIdsAndIn(params.status);
            else 
                searchOrder["status"] = { $ne: "Cancelled" }
        }

        function splitIdsAndIn(ids){
            if(!ids) return undefined;
            return {
                "$in": ids.split(',')
            }
        }
    }   

    function response(){
        if(params.partnerlist == "true" && params.userlist == "true"){
            return  {
                phlebo: phlebos,
                logistics: logistics ,
                createdBy: createdBy,                
                partners: partners,
                response: orders,
                pageCount: page,
                itemCount: items
            }
        }
        else if(params.partnerlist == "true"){
            return  {
                partners: partners,
                response: orders,
                pageCount: page,
                itemCount: items
            }
        }
        else  {
            return  {
                response: orders,
                pageCount: page,
                itemCount: items
            }
        }
    }

    async.waterfall([getClients,getPartners,getUsers,getOrders], function(err){
        if(err) return callback(err);
        return callback(null, response());
    })
}

exports.getOrderlist = getOrderlist;

exports.getOrder = getOrder;