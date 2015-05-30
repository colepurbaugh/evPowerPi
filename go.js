var parseString = require('xml2js').parseString;
var http = require('http');

var options = {
	host: '169.237.123.39',
	port: '8080',
	path: '/WebService_PV_Power/PV_Power'
};

var plug = 1;
var power = 1.2;

var toDatabase = function (plug, power){
	options.path = '/WebService_PV_Power/PV_Power/' + plug + '/' + power

	http.request(options, function(response) {
		var str = '';
	
		//another chunk of data has been recieved, so append it to `str`
		response.on('data', function (chunk) {
			str += chunk;
		});
	
		//the whole response has been recieved, so we just print it out here
		response.on('end', function () {
			
			parseString(str, function (err, result) {
				//Error
				console.log('error = ' + result.Response.Terminal[0].Value[0]);
				//EV_Power_actual
				console.log('EVpower = ' + result.Response.Terminal[1].Value[0]);
				//EV_Plugged
				console.log('plugState = ' + result.Response.Terminal[2].Value[0]);
				//PV_Power_kW
				console.log('genPower = ' + result.Response.Terminal[3].Value[0]);
			});
	
		});
	}).end();
};


setInterval( function () {
	toDatabase(plug, power);
	if (plug < 5) {
		plug++
	}else {
		plug = 0;
	}
	if (power < 20) {
		power += 0.1
	} else {
		power = 0
	}
},1000);
