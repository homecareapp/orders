var mongoosePaginate = require("mongoose-paginate"),
    mongoose = require("mongoose");

var serviceinfo = new mongoose.Schema({

    provider_id: { type : mongoose.Schema.Types.ObjectId, ref:'Provider' },
    group: {
        type: String
    },
    title: {
        type: String
    },
    pagetype: {
        type: String,
        enum: ['TEST', 'DISEASE']
    },
    alias: Array,
    services: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
    }],
    description: {
        type: String
    },
    seo:{type:String},
    relatedservices:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
    }],
    gender:{type:String, enum:['MALE', 'FEMALE', 'BOTH']},
    bodypartrelatedto: Array
});

serviceinfo.pre('find', function(next) {
    this.populate([{
        path:'services',
        select:'name'
    },{
        path:'relatedservices',
        select:'name'
    }]);
    next();
});

serviceinfo.pre('findOne', function(next) {
    this.populate([{
        path:'services',
        select:'name'
    },{
        path:'relatedservices',
        select:'name'
    }]);
    next();
});

serviceinfo.plugin(mongoosePaginate);
module.exports = mongoose.model('ServiceInfo', serviceinfo);
