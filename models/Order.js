var mongoose = require('mongoose');
var async = require('async');
var mongoosePaginate = require('mongoose-paginate');
var Provider = require('./Provider');
var Service = require('./Service');
var moment = require('moment');
var ObjectID = mongoose.Schema.Types.ObjectId;

var schedulenotification = {
    ispatientremindersend: {
        type: Boolean,
        default: false
    },
    isvisitdetailstopatientsend: {
        type: Boolean,
        default: false
    },
    isserviceremindersend: {
        type: Boolean,
        default: false
    }
};

var prescription = [{
    name: String,
    url: String,
    description: String
}]

var signature = [{
    name: String,
    url: String,
    description: String
}];

var paymentdetails = {
    amount: { type: Number },
    paid: { type: Boolean, default: false },
    paymentmode: { type: String },
    paymentoptions: [{ type: mongoose.Schema.Types.Mixed }],
    visitingcharges: { type: Number },
    discount: { type: Number },
    orderDiscount: [{ type: mongoose.Schema.Types.Mixed }],
    promocode: { type: String },
    transactionData: { type: mongoose.Schema.Types.Mixed },
    reportdeliverymode: { type: mongoose.Schema.Types.Mixed }
};

var orderSchema = new mongoose.Schema({
    _Deleted: {
        type: Boolean,
        default: false
    },
    //end()

    servicedeliveryaddress: {
        _id:String,
        address2: String,
        landmark: String,
        area_id: { name: String,_id: String}
    },

    // servicedeliveryaddress: {
    //     _id: String,
    //     title: String,
    //     address: String,
    //     address2: String,
    //     address3: String,
    //     pincode: String,
    //     landmark: String,
    //     state: String,
    //     streetname: String,
    //     plotno: String,
    //     sectorno: String,
    //     building: String,
    //     wing: String,
    //     floor: String,
    //     flatno: String,
    //     city_id: {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'City'
    //     },
    //     area_id: {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'Area'
    //     },
    //     sublocation_id: {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'Area'
    //     },
    //     sublocation_text: {type:String},
    //     geolocation: {
    //         type: {
    //             type: String,
    //             default: 'point'
    //         },
    //         coordinates: [] //IMPORTANT: Always list coordinates in longitude, latitude order. Reference: http://docs.mongodb.org/manual/reference/geojson/
    //     }
    // },

    droppointaddress: { type: mongoose.Schema.Types.Mixed }, //Drop point object from partner 
    specialneed: [{ type: mongoose.Schema.Types.Mixed }], //Special need from specialneed master
    specialneedflag: { type: Boolean }, //Special need flag from specialneed master
    logistic: {
        delivertype: { type: String }, //DeliverToLab;HandoverToLogistics
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, //logistic user id
        username: { type: String },
        logistic_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
        },
        pickuptime: { type: Number },
        pickuppoint: { type: String }, //address of pickup point
        actualpickuppoint: { type: String },
        customerplace: { type: Boolean },
        remark:{ type: String },
        logisticremark: Array,
        pickupdate: Date,
        patientaddress: { type: Boolean },
        status: String
    },
    parentorder_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    area_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Area'
    },
    provider_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Provider'
    },
    partner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Partner'
    },
    client_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    type: {
        type: String
    },
    repeat: {
        type: Boolean,
        default: false
    },
    assignby: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    //new attribute added for mobile user
    prescriptions: prescription,
    signature: signature,
    //end
    fromdate: Date,
    todate: Date,

    fromtime: Number,
    totime: Number,

    createdatetime: {
        type: Date,
        default: Date.now
    },
    createdby: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdbyname: {type: String}, // incase same user login used by multiple person.
    //srl attribute
    refferedby: String,
    status: {
        type: String,
        default: 'Open'
    }, //Completed, Open, Postponed, Cancelled, Received
    statuscomment: String, // ToDo: Need to understand what is the pupose of this field

    services: [{
        service_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PartnerService'
        },
        price: Number
    }],

    serviceupdatecomment:
        {
            testupdatereason:{ type: mongoose.Schema.Types.Mixed },
            testupdatecomment:{ type: mongoose.Schema.Types.Mixed }
        }
    ,
    addpatientcomment:
        {
            addpatientothercomment:{ type: mongoose.Schema.Types.Mixed },
            addpatientreasons:{ type: mongoose.Schema.Types.Mixed }
        }
    ,
    discountupdatecomment:
        {
            discountupdatereason:{ type: mongoose.Schema.Types.Mixed },
            discountupdatecomment:{ type: mongoose.Schema.Types.Mixed }
        }
    ,
    masterservices: [{
        service_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Service'
        },
        price: Number
    }],

    tubes: { type: mongoose.Schema.Types.Mixed }, //tubes against the order.
    pendingtubes: { type: mongoose.Schema.Types.Mixed }, //pendingtubes against the order.
    externalId: String, //external ID,
    orderGroupId: String, // Grouping of Order 
    paymentdetails: paymentdetails, //all payment details.
    comments: Array, //REMARKS while creating
    visitcomments: [], //visit comment at the time of completion of the order
    ordertype: {type:String}, //Fasting or PP
    servicetime: Date, // when order status = completed
    servicerequest_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceRequest'
    },
    // details:mongoose.Schema.Types.Mixed, //Have patient_ID, staffID, Date, Status
    statuslog: [{
        type: { type: String, default: 'point' },
        statustimestamp: { type: Date },
        comment: { type: String },
        status: { type: String },
        statusby: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        coordinates: [] //IMPORTANT: Always list coordinates in longitude, latitude order. Reference: http://docs.mongodb.org/manual/reference/geojson/
    }],

    log: [
        // oldbranch_id : { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
        // newbranch_id : { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
        {
            oldstatus: String,
            newstatus: String,
            olddate: Date,
            newdate: Date,
            oldtime: Number,
            newtime: Number,
            updatedby: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            oldassignto: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            newassignto: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            updateddatetime: Date,
            comments: String,
            old: { type: mongoose.Schema.Types.Mixed },
            new: { type: mongoose.Schema.Types.Mixed },
            action: String //schedulechange,statuschange,staffchange, servicechange, branchchnage, remarkchange
        }
    ],
    call_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Call'
    },
    schedulenotification: schedulenotification,

    source: {
        type: String,
        default: 'Web'
    }
}, {strict: false});

// orderSchema.index({fromtime: 1, fromdate:1, partner_id:1});
// orderSchema.index({assignto:1, status:1, ordertype:1, provider_id:1, client_id:1, orderGroupId:1, parentorder_id:1});
// orderSchema.index({"logistic.logistic_id":1, "logistic.status":1, "log.0.updatedby":1, "servicedeliveryaddress.area_id._id":1 });



orderSchema.plugin(mongoosePaginate);
var orderModel = mongoose.model('Order', orderSchema);


module.exports = orderModel;
