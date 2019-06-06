var Model = require("../models/PartnerService"),
    mongoose = require("mongoose"),
    mongoosePaginate = require("mongoose-paginate"),
    async = require('async');

var OptionMasterModel = require('../models/OptionMaster');
var PatientInstructionModel = require('../models/PatientInstruction');
var _ = require("lodash");

exports.getTubesAndCI = getTubesAndCI;

exports.getSuperSetServices = function(req, res, next) {
    if(!req.body.serviceIds) return next(new Error("Please send serviceIds"))
    if(!req.body.serviceIdtoadd) return next(new Error("Please send serviceIdtoadd"))

    var serviceIds = req.body.serviceIds;
    //serviceIds.push(req.body.serviceIdtoadd);

    var services = [];
    var resServices = [];
    var resServiceToAdd = {};
    var finalServicesId = [];
    var fewExist = false;
    var message = "";
    var messageSome = "";
    var serviceIdsToAdd = [];

    var service2FullCovered = false;;

    async.waterfall([
        function(nextfun) {
            //find service using ids
            var search = {};
            search["_id"]={$in: serviceIds}
            Model.find(search, null, { lean:true }, function(err, servicesResult) {
                if (err) return nextfun(new Error(err));
                servicesResult.forEach(function(serObj){
                    services.push({"service_id":serObj})
                })
                Model.findById({"_id":req.body.serviceIdtoadd}, null, { lean:true }, function(err, serviceaddobj) {
                    services.push({"service_id":serviceaddobj})
                    return nextfun(null)
                })
                //return nextfun(null)
                
            });
        },
        function(nextfun) {
            services.forEach(function (serviceObj, index) {
                var obj = {}
                //var name = serviceObj.service_id.name;
                var _id = serviceObj.service_id._id.toString();
                getUniqueTestsFromServices([serviceObj],function(err, uniqueServices){
                    var ids = [];
                    uniqueServices.forEach(function(us){
                        ids.push(us._id.toString());
                    })
                    obj[_id] = ids
                })
                if(services.length - 1 == index)
                {
                    resServiceToAdd = obj;
                }
                else
                {
                    resServices.push(obj)
                }
                
            });
            return nextfun(null)
        },
        function(nextfun) {
            if(resServices.length > 0)
            {
                for (var j = 0; j < resServices.length; j++) {
                        var firstServices;
                        var firstID;
                        for (var key in resServices[j]) {
                          firstServices = resServices[j][key];
                          firstID = key;
                        }

                        var secondServices;
                        var secondID;
                        for (var key in resServiceToAdd) {
                          secondServices = resServiceToAdd[key];
                          secondID=key
                        }

                        var diff = _.difference(firstServices, secondServices);

                        if(diff.length!=0 && diff.length == firstServices.length)
                        {
                            // both array are different
                            //fewExist = false;
                            var foundIndexfirst = _.findIndex(finalServicesId, function(t)
                                    { 
                                        for (var key in t) {
                                            return t[key] == resServices[j][firstID]; 
                                        }
                                        
                                    });
                            if(foundIndexfirst < 0)
                                finalServicesId = finalServicesId.concat(resServices[j])

                            var foundIndexsecond = _.findIndex(finalServicesId, function(t)
                                    { 
                                        for (var key in t) {
                                            return t[key] == resServiceToAdd[secondID]; 
                                        }
                                        
                                    });

                            if(foundIndexsecond < 0)
                                finalServicesId = finalServicesId.concat(resServiceToAdd)

                            if(service2FullCovered)
                            {
                                finalServicesId.forEach(function(t,index){
                                    for (var key in t) {
                                        if(t[key] == resServiceToAdd[secondID])
                                        {
                                            finalServicesId.splice(index,1)

                                        }
                                    }
                                })
                            }
                        }
                        else if(diff.length!=0 && diff.length < firstServices.length)
                        {
                            var diffRev = _.difference(secondServices, firstServices);

                            // if(diffRev.length!=0 && diffRev.length == secondServices.length)
                            // {
                            //     var foundIndex = _.findIndex(finalServicesId, function(t)
                            //         { 
                            //             for (var key in t) {
                            //                 return t[key] == resServiceToAdd[secondID]; 
                            //             }
                                        
                            //         });
                            //     if(foundIndex < 0)
                            //         finalServicesId = finalServicesId.concat(resServiceToAdd)
                            // }
                            if(diffRev.length!=0 && diffRev.length < secondServices.length)
                            {
                                //some are present
                                fewExist = true;
                                var service2 = "";
                                services.forEach(function(ser){
                                    if(ser.service_id._id.toString() == secondID)
                                    {
                                        service2 = ser.service_id.name;
                                    }
                                });
                                var service1 = "";
                                services.forEach(function(ser){
                                    if(ser.service_id._id.toString() == firstID)
                                    {
                                        service1 = ser.service_id.name;
                                    }
                                });
                                messageSome += "Some Components of "+service2+" are present in "+service1 +",<br>Are you sure you want to add "+service2+".<br><br>";
                                //serviceIdsToAdd.push(secondID)
                                var foundIndexsecond = _.findIndex(finalServicesId, function(t)
                                    { 
                                        for (var key in t) {
                                            return t[key] == resServiceToAdd[secondID]; 
                                        }
                                        
                                    });
                                if(foundIndexsecond < 0)
                                    finalServicesId = finalServicesId.concat(resServiceToAdd)

                                var foundIndexfirst = _.findIndex(finalServicesId, function(t)
                                    { 
                                        for (var key in t) {
                                            return t[key] == resServices[j][firstID]; 
                                        }
                                        
                                    });
                                if(foundIndexfirst < 0)
                                    finalServicesId = finalServicesId.concat(resServices[j])

                                if(service2FullCovered)
                                {
                                    finalServicesId.forEach(function(t,index){
                                        for (var key in t) {
                                            if(t[key] == resServiceToAdd[secondID])
                                            {
                                                finalServicesId.splice(index,1)

                                            }
                                        }
                                    })
                                }

                                // finalServicesId = [];
                                // break;
                            }
                            else if(diffRev.length == 0)
                            {
                                //fewExist = false;
                                //service 2 is already covered in service 1
                                var foundIndex = _.findIndex(finalServicesId, function(t)
                                    { 
                                        for (var key in t) {
                                            return t[key] == resServices[j][firstID]; 
                                        }
                                        
                                    });
                                if(foundIndex < 0)
                                {

                                    finalServicesId.forEach(function(t,index){
                                        for (var key in t) {
                                            if(t[key] == resServiceToAdd[secondID])
                                            {
                                                finalServicesId.splice(index,1)

                                            }
                                        }
                                    })

                                    var service2 = "";
                                    services.forEach(function(ser){
                                        if(ser.service_id._id.toString() == secondID)
                                        {
                                            service2 = ser.service_id.name;
                                        }
                                    });
                                    var service1 = "";
                                    services.forEach(function(ser){
                                        if(ser.service_id._id.toString() == firstID)
                                        {
                                            service1 = ser.service_id.name;
                                        }
                                    });
                                    message += service2+" is already covered in "+service1+".<br><br>"

                                    service2FullCovered = true

                                    // var service2 = "";
                                    // services.forEach(function(ser){
                                    //     if(ser.service_id._id.toString() == secondID)
                                    //     {
                                    //         service2 = ser.service_id.name;
                                    //         message += service2+" is already covered in selected services"+".<br><br>"
                                    //     }
                                    // })
                                    finalServicesId = finalServicesId.concat(resServices[j])
                                    if(service2FullCovered)
                                    {
                                        finalServicesId.forEach(function(t,index){
                                            for (var key in t) {
                                                if(t[key] == resServiceToAdd[secondID])
                                                {
                                                    finalServicesId.splice(index,1)

                                                }
                                            }
                                        })
                                    }
                                }
                            }
                        }
                        else if(diff.length == 0)
                        {
                            //fewExist = false;
                            var diffRev = _.difference(secondServices, firstServices);
                            if(diffRev.length!=0 && diffRev.length == secondServices.length)
                            {
                            }
                            else if(diffRev.length < secondServices.length)
                            {

                                //service 1 is already covered in service 2

                                finalServicesId.forEach(function(t,index){
                                    for (var key in t) {
                                        if(t[key] == resServices[j][firstID])
                                        {
                                            finalServicesId.splice(index,1)

                                            

                                        }
                                    }
                                })

                                var service2 = "";
                                services.forEach(function(ser){
                                    if(ser.service_id._id.toString() == secondID)
                                    {
                                        service2 = ser.service_id.name;
                                    }
                                });
                                var service1 = "";
                                services.forEach(function(ser){
                                    if(ser.service_id._id.toString() == firstID)
                                    {
                                        service1 = ser.service_id.name;
                                    }
                                });

                                message += service1+" is removed, as it gets covered in "+service2+".<br><br>"
                                


                                var foundIndexsecond = _.findIndex(finalServicesId, function(t)
                                    { 
                                        for (var key in t) {
                                            return t[key] == resServiceToAdd[secondID]; 
                                        }
                                        
                                    });

                                if(foundIndexsecond < 0)
                                {
                                    finalServicesId = finalServicesId.concat(resServiceToAdd)

                                    // var service2 = "";
                                    // services.forEach(function(ser){
                                    //     if(ser.service_id._id.toString() == secondID)
                                    //     {
                                    //         service2 = ser.service_id.name;
                                    //     }
                                    // });
                                    // var service1 = "";
                                    // services.forEach(function(ser){
                                    //     if(ser.service_id._id.toString() == firstID)
                                    //     {
                                    //         service1 = ser.service_id.name;
                                    //     }
                                    // });
                                    // message += service1+" is removed, as it gets covered in "+service2+".<br><br>"
                                    
                                    
                                }
                            }
                        }
                }
            }
            else
            {
                finalServicesId = finalServicesId.concat(resServiceToAdd)
            }
            return nextfun(null)
        },
        function(nextfun) {
            var sortedIds = [];
            finalServicesId.forEach(function(fid){
                for (var key in fid) {
                    sortedIds.push(key)
                }
            })
            
            return nextfun(null, sortedIds)
        }
    ], function(error, sortedIds) {
        if(error) return next(error);
        var search = {};
            search["_id"]={$in: sortedIds}
        Model.find(search, function(err, servicesResult) {
            resp = {"services":servicesResult,
                    "fewExist":fewExist,
                    "message":message,
                    "messageSome":messageSome};
        return res.json(resp);
        })
        
        
    })
}

function getTubesAndCI(services,partnerShareTubeFlag, callback) {
    var uniqServices = [], returnParam = {};
    var getUniqueSevices = function(next){
        getUniqueTestsFromServices(services, function(e, s){
            if(e) return next(e);
            uniqServices = s;
            return next(null);
        });
    }

    var getTubes = function (next) {
        var tubeCount = 0, totalCount =0, lastTubeId, tempTubes = [];
        uniqServices.forEach(function(ptObj){
            lastTubeId = undefined; //to update tube id for next test
            if (ptObj.masterservice && ptObj.masterservice.tubes) {
                var tubeIdsCount = _.groupBy(ptObj.masterservice.tubes, function (t) {
                                    return [t._id]
                                });
                ptObj.masterservice.tubes.forEach(function(tube) {
                    foundIndex = _.findIndex(tempTubes, function(t) { return t._id == tube._id.toString(); });
                    //checking test id index for tube
                    if(!lastTubeId || lastTubeId != tube._id){
                        tubeCount = tubeIdsCount[tube._id].length;
                        totalCount = tubeIdsCount[tube._id].length;
                    }
                    lastTubeId = tube._id;
                    
                    // tube not found 
                    if (foundIndex<0){
                       var tubeObj = {
                           count:1,
                           _id: tube._id,
                           company: tube.company,
                           size: tube.size,
                           type: tube.type,
                           departments: [],
                           test_ids:[]
                       };

                       tubeObj.departments.push({id:ptObj.masterservice.department_id._id,count:tubeCount});
                       tubeObj.test_ids.push(ptObj._id);
                       tubeCount--;
                       tempTubes.push(tubeObj);
                    }
                    else{
                        var departmentIndexInAddedTube = _.findIndex(tempTubes[foundIndex].departments, function(o){return o.id.toString()==ptObj.masterservice.department_id._id});

                        //share tube  false and department not added in temptube
                        if(!partnerShareTubeFlag && departmentIndexInAddedTube <0){
                            tempTubes[foundIndex].departments.push({id:ptObj.masterservice.department_id._id,count:tubeCount});
                            
                            tempTubes[foundIndex].count = 0
                            tempTubes[foundIndex].departments.forEach(function(d){
                                tempTubes[foundIndex].count = tempTubes[foundIndex].count + d.count;
                            })
                            tubeCount--;
                        }
                        //if share tube is false and department found in added tempTubes  
                        else if(!partnerShareTubeFlag && departmentIndexInAddedTube>=0){
                            // check if all tubes for given test is added?

                            // if same deparment having two tests and tube count is less in one test so taking highest tubecount
                            if(tempTubes[foundIndex].departments[departmentIndexInAddedTube].count < totalCount) 
                                tempTubes[foundIndex].departments[departmentIndexInAddedTube].count = totalCount; 

                            tempTubes[foundIndex].count = 0
                            tempTubes[foundIndex].departments.forEach(function(d){
                                tempTubes[foundIndex].count = tempTubes[foundIndex].count + d.count;
                            })
                            tubeCount--;
                        }

                        //if shareTube = true
                        else if(_.findIndex(tempTubes[foundIndex].test_ids, function(testId) {return testId == ptObj._id }) > -1 && tubeCount >0){
                            tempTubes[foundIndex].count++;
                            tubeCount--;
                        }

                        // check if all tubes for given test is added?
                        else if(_.findIndex(tempTubes[foundIndex].test_ids, function(testId) {return testId != ptObj._id }) > -1 && tubeCount>tempTubes[foundIndex].count){
                            tempTubes[foundIndex].count++;
                            tubeCount--;
                        }
                        // //multiple same tubes in a test 
                        // if(_.findIndex(tempTubes[foundIndex].department_id, function(o){return o==ptObj.masterservice.department_id._id})>-1){
                        //     tempTubes[foundIndex].count++;
                        // }
                            // }
                    };
                });
            };
        });
        returnParam.tubes = tempTubes;
        return next(null);
    }   

    var sortTube = function(next) {
        sortTubes(returnParam.tubes, 'TubeType', function(e,sotredTubes){
            returnParam.tubes = sotredTubes;
            return next(null);
        });
    }

    var getCI = function(next) {
        getCIFromUniqueServices(uniqServices, function(e,cis){
            returnParam.ci = cis
            return next(null);
        });
    }

    var getSI = function(next) {
        getSIFromUniqueServices(uniqServices, function(e,sis){
            returnParam.si = sis
            return next(null);
        });
    }

    async.waterfall([getUniqueSevices, getTubes, sortTube, getCI, getSI], function(error) {
        if(error) callback(error);
        return callback(null, returnParam);
    });
}

exports.getCustomerInstructions = function(req, res, next) {
    var services = req.body.services;
    // getCustomerInstruction(services, function(e, result){
    //     //return next(null,result)
    //     return res.json({
    //         response:result
    //     });
    // })
    var partnerShareTubeFlag = services[0].service_id.partner_id.sharetubes;
    getTubesAndCI(services, partnerShareTubeFlag, function(e, result){
        return res.json({
            "patientInstructions":result.ci,
            "specialInstructions":result.si,
            "tubes":result.tubes
        });
    })
}

exports.getOrderCustomerInstructions = function(services, next) {
    getCustomerInstruction(services, function(e, result){
        return next(null,result)
    })
}

exports.getAllUniqueTestsFromServices = function(req, res, next) {
    var services = req.body.services;
    getUniqueTestsFromServices(services, function(e, result){
        return res.json({
            "response":result
        });
    })
}

exports.getUniqueTestsFromServices = getUniqueTestsFromServices;

function getUniqueTestsFromServices(services, callback) {
    var uniqueServices = [];
    var allServices = [];
    services.forEach(function (serviceObj) {
        if(serviceObj.service_id)
        {
            if(serviceObj.service_id.category == 'TEST')
            {
                allServices.push(serviceObj.service_id)
                //allServices = [];
            }
            if(serviceObj.service_id.category == 'PROFILE')
            {
                if(serviceObj.service_id.childs)
                {
                    if(serviceObj.service_id.childs.length)
                    {
                        serviceObj.service_id.childs.forEach(function(childObj){
                            if(childObj.test_id)
                            {
                                if(childObj.test_id.category == "TEST")
                                {
                                    allServices.push(childObj.test_id)
                                }
                                if(childObj.test_id.category == "PROFILE")
                                {
                                    var tempServices = []
                                    getTestFromProfile(childObj,tempServices, function(e, data){
                                        allServices = allServices.concat(data)
                                    })
                                }
                            }
                        })
                    }
                }
            }
            if(serviceObj.service_id.category == 'PACKAGES')
            {
                if(serviceObj.service_id.childs)
                {
                    if(serviceObj.service_id.childs.length)
                    {
                        serviceObj.service_id.childs.forEach(function(childObj){
                            if(childObj.test_id)
                            {
                                if(childObj.test_id.category == "TEST")
                                {
                                    allServices.push(childObj.test_id)
                                }
                                if(childObj.test_id.category == "PROFILE")
                                {
                                    if(childObj.test_id.childs)
                                    {
                                        if(childObj.test_id.childs.length)
                                        {
                                            childObj.test_id.childs.forEach(function(childsChildObj){
                                                if(childsChildObj.test_id)
                                                {
                                                    if(childsChildObj.test_id.category == "TEST")
                                                    {
                                                        allServices.push(childsChildObj.test_id)
                                                    }
                                                    if(childsChildObj.test_id.category == "PROFILE")
                                                    {
                                                        var tempServices = []
                                                        getTestFromProfile(childsChildObj,tempServices, function(e, data){
                                                            allServices = allServices.concat(data)
                                                        })
                                                    }
                                                }
                                            })
                                        }
                                    }
                                }
                                if(childObj.test_id.category == "PACKAGES")
                                { 
                                    var tempServices = []
                                    getTestFromPackages(childObj,tempServices, function(e, data){
                                        allServices = allServices.concat(data)
                                    })
                                }
                            }
                        })
                    }
                }
            }
        }
    })

    var allServicesWithIds = _.filter(allServices, function(ser)
    { 
        return ser._id; 
    });

    if(allServicesWithIds.length)
    {
        uniqueServices = _.uniq(allServicesWithIds, function (item, key, _id) {
            return item._id.toString();
        });
        return callback(null,uniqueServices);
    }
    else
    {
        uniqueServices = [];
        return callback(null,uniqueServices);
    }
}

function getTestFromPackages(childPackage, tempServices, callback) {
    if(!tempServices)
        var tempServices = [];
    if(childPackage.test_id)
    {
        if(childPackage.test_id.childs)
        {
            if(childPackage.test_id.childs.length)
            {
                childPackage.test_id.childs.forEach(function(childObj){
                    if(childObj.test_id)
                    {
                        if(childObj.test_id.category == "TEST")
                        {
                            tempServices.push(childObj.test_id)
                        }
                        if(childObj.test_id.category == "PROFILE")
                        {
                            if(childObj.test_id.childs)
                            {
                                if(childObj.test_id.childs.length)
                                {
                                    childObj.test_id.childs.forEach(function(childsChildObj){
                                        if(childsChildObj.test_id)
                                        {
                                            if(childsChildObj.test_id.category == "TEST")
                                            {
                                                tempServices.push(childsChildObj.test_id)
                                            }
                                            if(childsChildObj.test_id.category == "PROFILE")
                                            {
                                                getTestFromProfile(childsChildObj, tempServices, function(e,data){

                                                });
                                            }
                                        }
                                    })
                                }
                            }
                        }
                        if(childObj.test_id.category == "PACKAGES")
                        {
                            getTestFromPackages(childObj, tempServices, function(e, data){
                                            
                            });
                        }
                    }
                });
            }
        }
    }
    return callback(null,tempServices);
}

function getTestFromProfile(childProfile, tempServices, callback) {
    if(!tempServices)
        var tempServices = [];
    if(childProfile.test_id)
    {
        if(childProfile.test_id.childs)
        {
            if(childProfile.test_id.childs.length)
            {
                childProfile.test_id.childs.forEach(function(childObj){
                    if(childObj.test_id)
                    {
                        if(childObj.test_id.category == "TEST")
                        {
                            tempServices.push(childObj.test_id)
                        }
                        if(childObj.test_id.category == "PROFILE")
                        {
                            getTestFromProfile(childObj,tempServices, function(e, data){
                                // allServices = allServices.concat(data)
                            })
                        }
                    }
                });
            }
        }
    }
    return callback(null,tempServices);
}

function getCIFromUniqueServices(uniqueServices, nextfun) {
    var fastingInstruction = [];
    var randomBloodInstruction = [];
    var randomRandomInstruction = [];

    var createFasting = function(next){
        async.each(uniqueServices, function(serObj, uniquenextrow) {
            if(serObj.customerinstructiontype == 'fasting')
            {
                if(serObj.customerinstructions)
                {
                    if(serObj.customerinstructions.length)
                    {
                        async.each(serObj.customerinstructions, function(obj, nextrow) {
                            PatientInstructionModel.findById(obj, function(error, ciObj) {
                                if(ciObj && ciObj.description)
                                    fastingInstruction.push(ciObj.description)
                                return nextrow()
                            })
                        }, function(error) {
                            if (error) return nextfun(error)
                            return uniquenextrow();
                        })
                    }
                    else
                        return uniquenextrow();
                }
                else
                    return uniquenextrow();
            }
            else
                return uniquenextrow();
        }, function(error) {
            if (error) return nextfun(error)
            fastingInstruction = _.uniq(fastingInstruction, function (item, key, a) {
                return item;
            });
            return next()
        })
    }

    var creatRandom = function(next){
        async.each(uniqueServices, function(serObj, uniquenextrow) {
            if(!serObj.sampletype)
            {
                serObj.sampletype = "";
            }
            if(serObj.customerinstructiontype != 'fasting' && serObj.sampletype.toLowerCase() != 'blood')
            {
                if(serObj.customerinstructions)
                {
                    if(serObj.customerinstructions.length)
                    {
                        async.each(serObj.customerinstructions, function(obj, nextrow) {
                            PatientInstructionModel.findById(obj, function(error, ciObj) {
                                if(ciObj && ciObj.description)
                                    randomRandomInstruction.push(ciObj.description)
                                return nextrow()
                            })
                        }, function(error) {
                            if (error) return nextfun(error)
                            return uniquenextrow();
                        })
                    }
                    else
                        return uniquenextrow();
                }
                else
                    return uniquenextrow();
            }
            else if(serObj.customerinstructiontype != 'fasting' && serObj.sampletype.toLowerCase() == 'blood')
            {
                if(serObj.customerinstructions)
                {
                    if(serObj.customerinstructions.length)
                    {
                        async.each(serObj.customerinstructions, function(obj, nextrow) {
                            PatientInstructionModel.findById(obj, function(error, ciObj) {
                                if(ciObj && ciObj.description)
                                    randomBloodInstruction.push(ciObj.description)
                                return nextrow()
                            })
                        }, function(error) {
                            return uniquenextrow();
                        })
                    }
                    else
                        return uniquenextrow();
                }
                else
                    return uniquenextrow();
            }
            else
                return uniquenextrow();
        }, function(error) {
            if (error) return nextfun(error)
            randomBloodInstruction = _.uniq(randomBloodInstruction, function (item, key, a) {
                return item;
            });
            randomRandomInstruction = _.uniq(randomRandomInstruction, function (item, key, a) {
                return item;
            });
            return next()
        })
    }
    

    async.waterfall([createFasting, creatRandom], function(error){
        var custInst = []
        if(fastingInstruction.length)
        {
            custInst = fastingInstruction.concat(randomRandomInstruction)
        }
        else
        {
            custInst = randomBloodInstruction.concat(randomRandomInstruction)
        }
        custInst = _.uniq(custInst, function (item, key, a) {
            return item;
        });
        
        return nextfun(null, custInst)
    });
}

function getSIFromUniqueServices(uniqueServices, nextfun) {
    var specialInstruction = [];

    async.each(uniqueServices, function(serObj, uniquenextrow) {
        if(serObj.specialinstructions)
        {
            if(serObj.specialinstructions.length)
            {
                async.each(serObj.specialinstructions, function(obj, nextrow) {
                    OptionMasterModel.findById(obj, function(error, siObj) {
                        var tempsiObj=siObj.toObject();
                        if(tempsiObj && tempsiObj.displayname){
                            if(tempsiObj.isattachment)
                                {
                                    delete tempsiObj.attachments;
                                }
                                
                            specialInstruction.push(tempsiObj)
                        }
                        return nextrow()
                    })
                }, function(error) {
                    return uniquenextrow();
                })
            }
            else
                return uniquenextrow();
        }
        else
            return uniquenextrow();
    }, function(error) {
        if (error) return nextfun(error)
        specialInstruction = _.uniq(specialInstruction, function (item, key, a) {
             return item._id.toString();
        });
        return nextfun(null, specialInstruction)
    })
}

function getCustomerInstruction(services, callback) {
    if(!services) return callback(null,[]);
    if(!services.length) return callback(null,[]);
    var fastingInstruction = [], randomInstruction = [];

    async.waterfall([
        function(nextfun) {
            getUniqueTestsFromServices(services, function(err, uniqueServices){
                return nextfun(null, uniqueServices)
            })
            
        },
        function(uniqueServices, nextfun) {
            var fastingInstruction = []
            uniqueServices.forEach(function(serObj){
                if(serObj.customerinstructiontype == 'fasting')
                {
                    if(serObj.customerinstruction)
                    {
                        serObj.customerinstruction = serObj.customerinstruction.toLowerCase();
                        var a = [];
                        a = serObj.customerinstruction.split(',\n');

                        //fastingInstruction.push(serObj.customerinstruction)
                        fastingInstruction = fastingInstruction.concat(a)
                    }
                }
            })
            fastingInstruction = _.uniq(fastingInstruction, function (item, key, a) {
                return item;
            });

            var randomBloodInstruction = [];
            var randomRandomInstruction = []
            uniqueServices.forEach(function(serObj){
                if(!serObj.sampletype)
                {
                    serObj.sampletype = "";
                }
                if(serObj.customerinstructiontype != 'fasting' && serObj.sampletype.toLowerCase() != 'blood')
                {
                    if(serObj.customerinstruction)
                    {
                        serObj.customerinstruction = serObj.customerinstruction.toLowerCase();

                        var a = [];
                        a = serObj.customerinstruction.split(',\n');
                        //randomRandomInstruction.push(serObj.customerinstruction)
                        randomRandomInstruction = randomRandomInstruction.concat(a)
                    }
                }
                if(serObj.customerinstructiontype != 'fasting' && serObj.sampletype.toLowerCase() == 'blood')
                {
                    if(serObj.customerinstruction)
                    {
                        serObj.customerinstruction = serObj.customerinstruction.toLowerCase();

                        var a = [];
                        a = serObj.customerinstruction.split(',\n');

                        //randomBloodInstruction.push(serObj.customerinstruction)
                        randomBloodInstruction=randomBloodInstruction.concat(a)
                    }
                }
            })
            
            randomBloodInstruction = _.uniq(randomBloodInstruction, function (item, key, a) {
                return item;
            });
            randomRandomInstruction = _.uniq(randomRandomInstruction, function (item, key, a) {
                return item;
            });
            var custInst = []
            if(fastingInstruction.length)
            {
                custInst = fastingInstruction.concat(randomRandomInstruction)
            }
            else
            {
                custInst = randomBloodInstruction.concat(randomRandomInstruction)
            }
            custInst = _.uniq(custInst, function (item, key, a) {
                return item;
            });
            
            return nextfun(null, custInst)
        }
    ], function(error, custInst) {
        if(error) return next(error);
        
        return callback(null,custInst);
        
    })
}

exports.getOrderTubesPriority = function(order, option, next) {
    getTubesPriority(order, option, function(e, result){
        return next(null,result)
    })
}

function getTubesPriority(order, option, callback){
    async.waterfall([
        function(nextfun) {
            // get optionmaster based on name = TubeType

            var search = {}
            search["name"] = option;

            OptionMasterModel.findOne(search, function(err, resultParent) {
                if (err) return nextfun(new Error(err));
                return nextfun(null, resultParent)
            });
        },
        function(resultParent, nextfun){
            // based on TubeType id , find add childs based on priority;
            var search = {};
            search["parent_id"] = resultParent._id;
            OptionMasterModel.find(search, function(err, resultChilds) {
                if (err) return nextfun(new Error(err));
                resultParent = resultParent;
                //resultParent.set('childs', resultChilds)
                resultParent.childs = resultChilds;
                resultParent.childs = _.sortBy(resultParent.childs,function(a){
                    return a.priority
                })
                return nextfun(null, resultParent)
            });
        },
        function(resultParent, nextfun){
            // sort order tubes based on its priority.
            var newtubes = [];
            resultParent.childs.forEach(function(typeObj) {
                var found = false;
                //order.tubes.forEach(function(tubeObj){                  
                order.tubes.filter(function(tubeObj) {
                    if(!found && tubeObj.type == typeObj.displayname) {
                        newtubes.push(tubeObj);
                        found = true;
                        return false;
                    } else {
                        return true;
                    }
                });
            });
            // order.set('tubes', newtubes);
            //order.tubes = newtubes;
            return nextfun(null, newtubes)
        }
    ], function(err, newtubes) {
        callback(null, newtubes)
    });
}

exports.sortTubes = sortTubes

function sortTubes(tubes, option, callback){
    async.waterfall([
        function(nextfun) {
            // get optionmaster based on name = TubeType

            var search = {}
            search["name"] = option;

            OptionMasterModel.findOne(search, {}, {lean:true}, function(err, resultParent) {
                if (err) return nextfun(new Error(err));
                return nextfun(null, resultParent)
            });
        },
        function(resultParent, nextfun){
            // based on TubeType id , find add childs based on priority;
            var search = {};
            search["parent_id"] = resultParent._id;
            OptionMasterModel.find(search, {}, {lean:true}, function(err, resultChilds) {
                if (err) return nextfun(new Error(err));
                resultParent = resultParent;
                //resultParent.set('childs', resultChilds)
                resultParent.childs = resultChilds;
                resultParent.childs = _.sortBy(resultParent.childs,function(a){
                    return a.priority
                })
                return nextfun(null, resultParent)
            });
        },
        function(resultParent, nextfun){
            // sort order tubes based on its priority.
            var newtubes = [];
            resultParent.childs.forEach(function(typeObj) {
                var found = false;
                //order.tubes.forEach(function(tubeObj){                  
                tubes.forEach(function(tubeObj) {
                    if(tubeObj.type == typeObj.displayname && _.findIndex(newtubes, function(t){return t._id == tubeObj._id}) < 0) {
                        newtubes.push(tubeObj);
                    }                          
                    
                });
            });
            // order.set('tubes', newtubes);
            //order.tubes = newtubes;
            return nextfun(null, newtubes)
        }
    ], function(err, newtubes) {
        callback(null, newtubes)
    });
}

