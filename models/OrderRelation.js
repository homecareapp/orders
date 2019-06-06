var mongoose = require('mongoose');

var orderRelationSchema = new mongoose.Schema({
    _Deleted: {type: Boolean,default: false},    
    order_id: {type: mongoose.Schema.Types.ObjectId,ref: 'Order'},
    provider_id: {type: mongoose.Schema.Types.ObjectId,ref: 'Provider'},
    partner_id: {type: mongoose.Schema.Types.ObjectId,ref: 'Partner'},
    ppVisits:[{
        client_id:{type: String},
        address_id:{type: String},
        time:{type: Number},
        order_id:{type: String},
        visitChargeApplicable:{type: Boolean},
        parentOrder_id:{type: String}
    }],
    primaryVisits:[{
        client_id:{type: String},
        address_id:{type: String},
        time:{type: Number},
        order_id:{type: String},
        visitChargeApplicable:{type: Boolean},
        parentOrder_id:{type: String}
    }],
    source: {type: String,default: 'Web'}
}, {strict: false});

module.exports = mongoose.model('orderRelation', orderRelationSchema);
