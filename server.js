var https = require('https');
var fs = require('fs');
var express = require('express');
var app = express();
var async = require('async');
var swig  = require('swig');

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.set('view cache', false);
swig.setDefaults({ cache: false });
app.use(express.static(__dirname + '/static'));

var options = {
	rejectUnauthorized: false,
	hostname: 'localhost',
	port: 4242,
	//path: '/qrs/app?xrfkey=abcdefghijklmnop',
	path: '/qrs/extension/schema?xrfkey=abcdefghijklmnop',
	method: 'GET',
	headers: {
		'x-qlik-xrfkey': 'abcdefghijklmnop',
		'X-Qlik-User': 'UserDirectory= Internal; UserId= sa_repository '
	},
	key: fs.readFileSync("C:\\CertStore\\localhost\\client_key.pem"),
	cert: fs.readFileSync("C:\\CertStore\\localhost\\client.pem")
};

app.get('/', function (req, res) {
  res.render('index', { /* template locals context */ });
});

app.get('/extensions', function (req, res) {
	var data = [];
	https.get(options, function (resp) {
		resp.on("data", function (chunk) {
			var ext = JSON.parse(chunk.toString());
			async.each(ext, function(file, callback) {
				data.push( ext )
				callback();
			
			}, function(err){
				//res.send(JSON.stringify( ext , null, 4));
				res.render('extensions', { extensions: ext });
			});			
							
		});
	}).on('error', function (e) {
		res.send("Got error: " + e.message);
	});
});



var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});