var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mySchema = new mongoose.Schema({
    _Deleted: {
        type: Boolean,
        default: false
    },
    provider_id: {
    	type: mongoose.Schema.Types.ObjectId,
        ref: 'Provider'
    },
    parser:String,
    entities:[{
    	active:{ type:Boolean,default:false},
    	syncHours:[Number],
    	name:String,
    	url:String
    }]
});
mySchema.plugin(mongoosePaginate);
module.exports = mongoose.model('IntegratorConfig', mySchema);