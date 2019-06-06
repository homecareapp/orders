/**
 * Author:=> Arbaz
 * Date:=> 17-10-2015
 */
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var masterservice = {
    service_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    tubes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tube' }],
    department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' } //changes made against feedback to add department against each compoments..
}

var serviceSchema = new mongoose.Schema({
    _Deleted: { type: Boolean, default: false },
    //  @abs [ new discountapplicable attribute added id discountapplicable == true no discound allowed for this test]
    discountnotapplicable: { type: Boolean, default: false },
    //end()

    archived: { type: Boolean, default: false }, //for integrator purpose
    metadata: { type: mongoose.Schema.Types.Mixed },
    provider_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
    name: { type: String },
    // shortname:{type:String},
    code: { type: String },
    externalId: String,
    description: { type: String },
    sampletype: { type: String },
    specialservice: { type: Boolean },
    repeat: { type: Boolean }, //pp visit
    method: { type: String }, //require method attribute against feedbak changes
    type: { type: String, enum: ['Client'] },
    alias: Array,
    category: { type: String, enum: ['TEST', 'PROFILE'] },
    tubes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tube' }],
    department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    childs: [masterservice],
    price: Number,
    customerinstruction: { type: String },
    specialinstruction: { type: String },
    sharetubes: { type: Boolean, default: false },
    tat: { type: String }, //new attribute added according to new excel

}, { strict: false });

serviceSchema.pre('find', function(next) {
    this.populate('childs.service_id tubes');
    next();
});


serviceSchema.pre('findOne', function(next) {
    this.populate('childs.service_id tubes');
    next();
});

serviceSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Service', serviceSchema);

// if name match not update
