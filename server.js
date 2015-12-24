var https = require('https');
var fs = require('fs');
var express = require('express');
var app = express();
var async = require('async');
var swig = require('swig');
var request = require('request');
var url = require('url');
var AdmZip = require('adm-zip');
var bodyParser = require('body-parser')
var github = require('octonode');
var client = github.client();


app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.set('view cache', false);
swig.setDefaults({ cache: false });
app.use(express.static(__dirname + '/static'));
app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({
  extended: true
}));

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
	key: fs.readFileSync("C:\\CertStore\\instance-2\\client_key.pem"),
	cert: fs.readFileSync("C:\\CertStore\\instance-2\\client.pem")
};

app.get('/', function (req, res) {
	res.render('index', { /* template locals context */ });
});

app.get('/extensions', function (req, res) {
  GetExtensions( function (ext) {
    res.render('extensions', { extensions: ext });
  })
});

function GetExtensions(callback) {
  var data = '';

  var r = https.request(options, function (resp) {
		resp.on("data", function (chunk) {
      data = data + chunk.toString();
		});

		resp.on('end', function(response) {
        var ext = JSON.parse(data.toString());
        async.each(ext, function (file, callback) {
          callback();
        }, function (err) {
          //return ext
          callback(ext)
        });
		})
	}).on('error', function (e) {
		//res.send("Got error: " + e.message);
	});
	r.end();
}

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

app.post('/versioncheck', function(req, res) {
	var repo = req.body.repo;
	repo = repo.replace('.git', '');
	repo = repo.replace('github.com', 'api.github.com/repos') + '/releases/latest';
	var version = req.body.version;
	console.log( repo + ' ' + version )
	var requestOptions = { url: repo, headers: {'User-Agent': 'request' } };

		request(requestOptions, function (error, response, release) {
			release = JSON.parse(release)
			tag = release.tag_name;
			res.send(release)
		});

})

app.post('/getrelease', function (req, res) {

	//var repo = 'https://github.com/countnazgul/QS-backup-and-restore-app.git';
	var repo = req.body.repo;
	    repo = repo.replace('.git', '');
	    repo = repo.replace('github.com', 'api.github.com/repos') + '/releases/latest';

	var requestOptions = { url: repo, headers: {'User-Agent': 'request' } };
		request(requestOptions, function (error, response, release) {
			var str = '';
			    str = JSON.parse(response.body.toString());

 			var p = str.assets[0].browser_download_url;
			var file_name = url.parse(p).pathname.split('/').pop();
			var file = fs.createWriteStream("./temp/" + file_name);

			file.on('finish', function() {
				readZip("./temp/" + file_name,  function() {
					res.send('done')
				})
			})
			request
			  .get(p)
			  .on('response', function(response) {
			   })
			  .pipe( file )
	})
});

app.get('/fromgithub', function(req, res) {
  //var url = req.body.url;
  var url = 'https://github.com/countnazgul/jQuery-Slider';
  url = url.split('/');
  var user = url[3];
  var repo = url[4];

  var ghuser         = client.user(user);
  var ghrepo         = client.repo(user + '/' + repo);

  ghrepo.contents('', "master", function(err, files) {

    if( JSON.stringify(files).indexOf('.qext') == -1) {
      res.send('not qlik sense extension/mashup')
    } else {
      var qext = '';
      async.each(files, function (file, callback) {
        if(file.name.indexOf('.qext') != -1) {
          qext = file;
        }
        callback();
      }, function (err) {
        var requestOptions = { url: qext.download_url, headers: {'User-Agent': 'request' } };

      		request(requestOptions, function (error, response, content) {
      			content = JSON.parse(content)
      			name = content.name;
            //name = 'Grid mashup template'
            var exists = false;
            GetExtensions(function(extensions) {
              async.each(extensions, function (ext, callback) {
                if(ext.name === name) {
                  exists = true;
                }
                callback();
              }, function (err) {
                if(exists == true) {
                  res.send('already exists')
                } else {
                  res.send('new')
                }
              })
            })
      		});
      });
    }
  });
})

function readZip(filename, callback) {

var zip = new AdmZip(filename);
    var zipEntries = zip.getEntries(); // an array of ZipEntry records

	async.each(zipEntries, function (zipEntry, callback) {
		if( !zipEntry.isDirectory ) {
			name = zipEntry.entryName
			name = name.substr(name.indexOf('/') + 1)
			name = name.replace(/\//g, '//');
			console.log(name)
			updateFile(name, zipEntry.getData().toString('utf8'), function() {
				fs.unlink(filename, function() {
					callback();
				})

			})
		} else {
			callback();
		}

	}, function (err) {
		callback();

	});
//});
}

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
			//console.log(chunk.toString())
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
