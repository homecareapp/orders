var async = require('async');
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var clientDemography = {
    salutation: String,
    fullname: { type: String, uppercase: true, trim: true },
    /** remove by talat sir */
    firstname: { type: String, uppercase: true, trim: true },
    lastname: { type: String, uppercase: true, trim: true },
    // added new attribute as said by talat sir from mly bugs list
    middlename:{ type: String, uppercase: true, trim: true },
    // end
    assumeddob: {
        type: Boolean,
        default: false
    },
    dob: Date,
    age: String,
    agetype: String, //month year values change to enum 
    bloodgroup: String,
    height: Number,
    weight: Number,
    unittyep: String, //cms inches values enum
    landlinenumber: String,
    mobilenumber: String,
    //new set colllection on  alternative number
    altnumber: Array,
    gender: String,
    email: String,
    deceased: {
        type: Boolean,
        default: false
    },
    deceasedcomment: {
        type: String
    },
    deceaseddate: Date,
    addresses: [ {_id:{type: mongoose.Schema.Types.ObjectId,ref: 'Address'}}],//[

        // {
        //     title: String,
        //     servicedeliveryaddress: String, //true false default
        //     address: String,
        //     address2: String,
        //     address3: String,
        //     pincode: String, //sublocation pincode
        //     landmark: String,
        //     state: String,
        //     streetname: String,
        //     plotno: String,
        //     sectorno: String,
        //     building: String,
        //     wing: String,
        //     floor: String,
        //     flatno: String,
        //     area:String,
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
        // }
    //],
    languagesknown: Array,
    maritalstatus: String,
    emergencycontactnumber: {
        type: String,
        default: ''
    },
    emergencycontactpersonname: {
        type: String,
        default: ''
    },
    emergencycontactpersonrelation: {
        type: String,
        default: ''
    }
};


var clientSchema = new mongoose.Schema({
    _Deleted: {
        type: Boolean,
        default: false
    },
    // externalId refers to UHID for holyfamily
    externalId:String,
    clientcode: String, 
    referredby: String,
    referredbyname: String,
    demography: clientDemography,
    specialneeds: [{ type: mongoose.Schema.Types.Mixed }],
    registrationdate: {
        type: Date,
        default: Date.now()
    },
    type: {
        type: String,
        default: 'nonmember'
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    provider_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Provider'
    },
    partner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Partner'
    },
});

clientSchema.index({'demography.firstname': 1, 'demography.lastname':1, 'demography.middlename':1, 'demography.fullname':1 });

// static method to add client result
clientSchema.statics.addClient = function(data, callback) {
    var serviceRequest = this.model('Client');
    var addClient = new serviceRequest(data);
    addClient.save(function(error, result) {
        if (error) return callback(error);
        addClient.save(function(error, clientresult) {
            if (error) return (error);
            return callback(null, clientresult);
        });
    });
}


//static method to update
clientSchema.statics.updateClient = function(data, callback) {
    var client = this.model('Client');
    var id = data._id;
    if (!id || !data._id) {
        return callback(new Error("Client Id Not Found To Update"))
    } else {
        client.findById(id, function(error, result) {
            if (error) return (error)
            for (var key in data) {
                if (typeof result[key] !== "function") {
                    result[key] = data[key];
                };
            }
            result.save(function(error, result) {
                if (error) return callback(error)
                return callback(null, result)
            })
        })
    }
}



clientSchema.pre("find", function(next) {
    // this.populate("user_id demography.addresses.city_id demography.addresses.area_id demography.addresses.sublocation_id");
    //this.populate("user_id demography.addresses._id");
    this.populate("user_id");
    next();
});

clientSchema.pre("findOne", function(next) {
    // this.populate("user_id demography.addresses.city_id demography.addresses.area_id demography.addresses.sublocation_id");
    //this.populate("user_id demography.addresses._id");
    this.populate("user_id");
    next();
});

clientSchema.plugin(mongoosePaginate);



module.exports = mongoose.model('Client', clientSchema);
