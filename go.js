var parseString = require('xml2js').parseString;
var http = require('http');

var objectEx = {
	property1: 'text',
	property2: 4
}

var options = {
	host: '169.237.123.39',
	port: '8080',
	path: '/WebService_PV_Power/PV_Power'
};

var temporary;

callback = function(response) {
	var str = '';

	//another chunk of data has been recieved, so append it to `str`
	response.on('data', function (chunk) {
		str += chunk;
	});

	//the whole response has been recieved, so we just print it out here
	response.on('end', function () {
		
		parseString(str, function (err, result) {
			console.log(objectEx);
			console.log('\n\r*********************\n\r');
			console.log(result);
			console.log('\n\r*********************\n\r');
			console.log(result.Response.Terminal);
			
		});

	});
}

http.request(options, callback).end();