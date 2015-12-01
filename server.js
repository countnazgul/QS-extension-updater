var https = require('https');
var fs = require('fs');
var express = require('express');
var app = express();
var async = require('async');
var swig = require('swig');
var request = require('request');
var url = require('url');
var AdmZip = require('adm-zip');

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
			async.each(ext, function (file, callback) {
				console.log(ext)
				//data.push( ext )
				callback();

			}, function (err) {
				//res.send(JSON.stringify( ext , null, 4));
				res.render('extensions', { extensions: ext });
			});

		});
	}).on('error', function (e) {
		res.send("Got error: " + e.message);
	});
});

app.get('/update', function (req, res) {

	var extName = encodeURIComponent('backup-and-restore');
	var fileName = encodeURIComponent('js\\qsocks.bundle.js');

	var options = {
		rejectUnauthorized: false,
		hostname: 'localhost',
		port: 4242,
		//path: '/qrs/app?xrfkey=abcdefghijklmnop',
		path: '/qrs/extension/' + extName + '/uploadfile?externalpath=' + fileName + '&overwrite=true&xrfkey=abcdefghijklmnop',
		method: 'POST',
		headers: {
			'x-qlik-xrfkey': 'abcdefghijklmnop',
			'X-Qlik-User': 'UserDirectory= Internal; UserId= sa_repository',
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		key: fs.readFileSync("C:\\CertStore\\localhost\\client_key.pem"),
		cert: fs.readFileSync("C:\\CertStore\\localhost\\client.pem")
	};

	var r = https.request(options, function (resp) {
		resp.on("data", function (chunk) {
			console.log(chunk.toString())
			res.send(chunk.toString())
		});
	}).on('error', function (e) {
		res.send("Got error: " + e.message);
	});

	var data = fs.readFileSync('c:\\qsocks.bundle.js');
	r.write(data);
	r.end();

})

app.get('/getrelease', function (req, res) {
 
	var options = {
		hostname: 'api.github.com',
		path: '/repos/countnazgul/QS-backup-and-restore-app/releases/latest',
		method: 'GET',
		headers: {
 			'user-agent': 'Mozilla/5.0'
		}
	};

	callback = function(response) {
		var str = '';	
		response.on('data', function (chunk) {
			str += chunk;
		});
		
		response.on('end', function () {
			str = JSON.parse(str.toString())
			
 			var p = 'https://github.com/countnazgul/QS-backup-and-restore-app/releases/download/v0.8.2/backup-and-restore.zip';
			var file_name = url.parse(p).pathname.split('/').pop();	
			var file = fs.createWriteStream("c:\\" + file_name);
			
			file.on('finish', function() {
				res.send('done')
			})
			request
			.get(p)
			.on('response', function(response) {
				console.log(response.statusCode) // 200
				console.log(response.headers['content-type']) // 'image/png'
			})
			.pipe( file )							
		
		});
	}	
		
	https.get(options, callback).end();

});

app.get('/readzip', function (req, res) {
var zip = new AdmZip("c:\\backup-and-restore.zip");
    var zipEntries = zip.getEntries(); // an array of ZipEntry records

	async.each(zipEntries, function (zipEntry, callback) {
		if( !zipEntry.isDirectory ) {
			name = zipEntry.entryName
			name = name.substr(name.indexOf('/') + 1)
			name = name.replace(/\//g, '//');
			updateFile(name, zipEntry.getData().toString('utf8'), function() {
				console.log(name)
				callback();				
			})
		} else {
			callback();	
		}
		
	}, function (err) {
		res.send('done');
		
	});


    // zipEntries.forEach(function(zipEntry) {
	// 	//console.log(zipEntry.entryName)
	// 	if( !zipEntry.isDirectory ) {
	// 		name = zipEntry.entryName
	// 		name = name.substr(name.indexOf('/') + 1)
	// 		name = name.replace(/\//g, '//');
	// 		updateFile(name, zipEntry.getData().toString('utf8'), function() {
	// 			console.log(name)				
	// 		})
			
			
	// 	}
	// 	//data = zipEntry.getData()		
	// 	//console.log(data.toString('utf8'));	
	// })	
});

function updateFile(fileName, fileContent, callback) {
	var extName = encodeURIComponent('backup-and-restore');
	fileName = encodeURIComponent(fileName);

	var options = {
		rejectUnauthorized: false,
		hostname: 'localhost',
		port: 4242,
		//path: '/qrs/app?xrfkey=abcdefghijklmnop',
		path: '/qrs/extension/' + extName + '/uploadfile?externalpath=' + fileName + '&overwrite=true&xrfkey=abcdefghijklmnop',
		method: 'POST',
		headers: {
			'x-qlik-xrfkey': 'abcdefghijklmnop',
			'X-Qlik-User': 'UserDirectory= Internal; UserId= sa_repository',
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		key: fs.readFileSync("C:\\CertStore\\localhost\\client_key.pem"),
		cert: fs.readFileSync("C:\\CertStore\\localhost\\client.pem")
	};

	var r = https.request(options, function (resp) {
		resp.on("data", function (chunk) {
			console.log(chunk.toString())
			//res.send(chunk.toString())
			callback('');
		});
		
		resp.on('end', function(response) {
			//console.log(response)
			
		}) 
	}).on('error', function (e) {
		//res.send("Got error: " + e.message);
	});

	//var data = fs.readFileSync('c:\\qsocks.bundle.js');
	r.write(fileContent);
	r.end();
}


var server = app.listen(3000, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port);
});