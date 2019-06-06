var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var tempReportSchema = new mongoose.Schema({
    _Deleted:{type:Boolean,default:false},
    tempreport_id: { type: String },
    headerinfo:mongoose.Schema.Types.Mixed,
    details:mongoose.Schema.Types.Mixed,
    source: {type:String,default:'webhcm'}
},{strict:false});

tempReportSchema.pre('save',function(next){
    var doc = this;
    if (!doc.isNew) return next();

    if (doc._id) doc.tempreport_id = doc._id.toString();

    return next();
});

tempReportSchema.statics.sampleReport = function(){
    var masterSampleReport = [        
        {"_id":"572aedfb90ce8f7c084f08e6","tempreport_id": "572aedfb90ce8f7c084f08e6","headerinfo":{"reportname":"Home Visit Report","reportdate":"","reportstaff":""},"details":{"homevisitreport":[{"reportname":"", "dateoflead":"", "timeoflead":"", "kdahcsename": "", "patientname": "", "patientuhid" : "", "r_n" : "", "r_o": "", "location": "", "patientcontactnumber": "", "patientage": "", "patientgender": "", "R_F_PP": "", "testname": "", "testcost": "", "visitcharge" : "", "totalcharge": "", "dateofvisit": "", "timeofvisit": "", "timeofvisit_am_pm": "", "status": "", "timeforpp":"", "timeforpp_am_pm":"", "ppstatus":"", "remark":""}]},"_Deleted":false,"__v":0}
    ];
    masterSampleReport.forEach(function(masterSampleReportObj){
        d = new module.exports(masterSampleReportObj);
        d.save();
    });
};

tempReportSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('TempReport',tempReportSchema);
