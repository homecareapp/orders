var http = require('http');
var https = require('https');
var urlParser = require("url");
var secrets = require('../config/secrets');

function send(url, postData, sendcb) {
    var postStringData = JSON.stringify(postData);
    //var x_user_id = req.user._id.toString();    //"56a8d0b9576f97df297442f3";
    //console.log("------------------URL---------------");
    //console.log(postData);
    var options = {
        hostname: urlParser.parse(url).hostname,
        path: urlParser.parse(url).path,
        port:urlParser.parse(url).port,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postStringData.length
        }
    };
    var body = "";

    var protocol = urlParser.parse(url).protocol;
    var httpHelper = http;
    if(protocol == 'https:')
        httpHelper = https;

    var req = httpHelper.request(options, function(httpres) {
        //console.log('STATUS: ' + httpres.statusCode);
        //console.log('HEADERS: ' + JSON.stringify(httpres.headers));
        httpres.setEncoding('utf8');
        httpres.on('data', function (chunk) {
            body += chunk;
        });
        httpres.on('end', function() {
            try{
                /*var data = body;  // JSON.parse(body);
                console.log("data");
                console.log(data);*/
                console.log("------------------End send---------------");
                return sendcb(null, {});
            }catch (e){
              return sendcb(e);
            };
        });
    });
    req.on('error', function(e) { 
        return sendcb(e);
    });
    // write data to request body
    req.write(postStringData);
    req.end();
}

function notification(data, cb) {
  if (!data) return cb(null, "Data not found");
  if (!data.user) return cb(null, "User not found");
  if (!data.user._id) return cb(null, "User ID not found");
  if (!data.message) return cb(null, "Message not found");

  switch(data.ntype){
    case 'push':
      var url = secrets.notification.url;
      url += "/api/notification/push";
      console.log(url);

      //Don't change postData object format !!!
      var postData = {
          "identities": [
          ],
          "content": {
              "apn": {
                  "alert": "",
                  "payload": {
                      
                  }
              },
              "gcm": {
                  "message": "",
                  "payload": {
                      
                  }
              }
          }
      };

      postData.identities.push(data.user._id.toString());
      postData.content.apn.alert = data.message;
      postData.content.gcm.message = data.message;
      
      send(url, postData, function(e, result){
        if(e) return cb(e);

        return cb(null, "Notification send");
      })
      break;
    default :
     return cb("Notification type not found");
     break;
  };
};

module.exports = notification;
