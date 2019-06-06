var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mySchema = new mongoose.Schema({
    _Deleted: {
        type: Boolean,
        default: false
    },
    inbound: { type: Boolean, default: false }, // if false outbount =>  true inbound =>  
    provider_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Provider'
    },
    url: String,
    method: { type: String, enum: ["PUT", "POST", "GET"] },
    data: { type: mongoose.Schema.Types.Mixed }, //post data
    result: { type: mongoose.Schema.Types.Mixed }, // response data
    datetime: { type: Date, default: Date.now }
});
mySchema.plugin(mongoosePaginate);
module.exports = mongoose.model('HooksLog', mySchema);
