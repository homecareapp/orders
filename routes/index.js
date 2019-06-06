var express = require('express');
var router = express.Router();
var passportConf = require('../config/passport');
var ordergetbyid = require('../controllers/getbyid');
var neworder = require('../controllers/newOrder');
var getorder = require('../controllers/getorders');
var updateorder = require('../controllers/updateOrder');

router.get('/orders/:id', passportConf.isAuthorized, function(req, res, next) {
    ordergetbyid.getById(req.params.id, function(e, r) {
        if (e) return next(new Error(e));
        return res.json({ response: r });
    });
});
router.get('/mapi/orders/:id', passportConf.isAuthorized, function(req, res, next) {
    ordergetbyid.getById(req.params.id, function(e, r) {
        if (e) return next(new Error(e));
        return res.json({ response: r });
    });
});

router.post('/addorders', passportConf.isAuthorized, function(req, res, next) {
    var data = req.body;
    if (!data) return next(new Error("Data not found"));
    data.loggedinuser = req.user;

    neworder.newOrder(data, function(e, orderresult, orderelationresult, ppOrderResult) {
        if (e) return next(e);
        return res.json({
            order: orderresult,
            orderrelation: orderelationresult,
            pporder: ppOrderResult
        });
    });
});

router.get('/orders', passportConf.isAuthorized, function(req, res, next) {
    req.query.loggedinuser = req.user;
    getorder.getOrder(req.query, function(e, r) {
        if (e) return next(new Error(e));
        return res.json(r);
    });
});

router.get('/getorderlist', passportConf.isAuthorized, function(req, res, next) {
    req.query.loggedinuser = req.user;
    getorder.getOrderlist(req.query, function(e, r) {
        if (e) return next(new Error(e));
        return res.json(r);
    });
});
router.get('/mapi/orders', passportConf.isAuthorized, function(req, res, next) {
    req.query.loggedinuser = req.user;
    getorder.getOrder(req.query, function(e, r) {
        if (e) return next(new Error(e));
        return res.json(r);
    });
});

router.put('/updateorder/:id', passportConf.isAuthorized, function(req, res, next) {
    var params = req.body;
    params.id = req.params.id;
    params.user_id = req.user._id;

    updateorder.updateOrder(params, function(e, orderresult) {
        if (e) return next(e);
        return res.json({
            response: orderresult,
        });
    });
});

module.exports = router;