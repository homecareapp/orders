var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mySchema = new mongoose.Schema({
    _Deleted: {
        type: Boolean,
        default: false
    },
    provider_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Provider'
    },
    url:String,
    details:{ type:mongoose.Schema.Types.Mixed },
    datetime:{ type:Date, default: Date.now }
});
mySchema.plugin(mongoosePaginate);
module.exports = mongoose.model('IntegratorConfigLog', mySchema);