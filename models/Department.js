/**
 * author:=> arbaz.
 * date:=> 19-10-2015
 */

var mongoose = require("mongoose"),
    mongoosePaginate = require("mongoose-paginate");


var populateQuery = [{
    path: 'provider_id',
    select: '_id name'
}];


var departmentSchema = new mongoose.Schema({

    _Deleted: {
        type: Boolean,
        default: false
    },
    //added new attribute for provider keep 
    provider_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Provider'
    },
    name: {
        type: String
    },
    description: {
        type: String
    }
});

departmentSchema.plugin(mongoosePaginate);

departmentSchema.pre('find', function(next) {
	this.populate(populateQuery);
	next();

})

departmentSchema.pre('findOne', function(next) {
	this.populate(populateQuery);
	next();

})

module.exports = mongoose.model("Department", departmentSchema);
