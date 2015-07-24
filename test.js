
var nodeNumber = 0;
console.log('Node number started ', nodeNumber);

var _ = require('lodash'),
	async = require('async');	

var parseString = require('xml2js').parseString;
var http = require('http'),
	options = {
		host: '169.237.123.39',
		port: '8080',
		path: '/WebService_PV_Power/PV_Power'
	};

var fs = require('fs'),
	fileName = '//root/Desktop/data' + new Date().getTime() + '.csv',
	header = 'timestamp, state, maxAmps, current, server,\r\n',
	intervalTime = 1000;

var evState = 0,
	maxAmps = 8,
	amperage = 0,
	kiloWatts = 0,
	ampsArray = [
	"$SC 8*12", "$SC 9*13", "$SC 10*3B", "$SC 11*3C", "$SC 12*3D", 
	"$SC 13*3E", "$SC 14*3F", "$SC 15*40", "$SC 16*41", "$SC 17*42", 
	"$SC 18*43", "$SC 19*44", "$SC 20*3C", "$SC 21*3D", "$SC 22*3E", 
	"$SC 23*3F", "$SC 24*40", "$SC 25*41", "$SC 26*42", "$SC 27*43", 
	"$SC 28*44", "$SC 29*45", "$SC 30*3D"];

//*****************************************************************************************

//create the log file and place it on the unit desktop	
fs.writeFileSync(fileName, header);
console.log(fileName + ' created on desktop');

//*****************************************************************************************

var set = {

	//variable "amps" must be between 8 and 16 for L1 (120V) 
	//                    and between 8 and 30 for L2 (240V)
	maxAmps: function(amps){
		if(amps <= 8 || amps >= 30){
			return false;
		}
		console.log('sending command ' + ampsArray[amps - 8]);
		serialPort.write(ampsArray[amps - 8] + "\r\n", function(err, results) {
			if(err && !_.isUndefined(err)){				
				console.log('err ' + err);				
				exit(0);			
			}
		});
	},

	//updates the local variables so that all functions can access them
	localVars: function (input){
		if (input > 0 && input < 5) {
			// 1 = not connected, 2 = ready, 3 = charge, 4 = vent
			evState = input;
			//console.log('evState is now ' + input);
		} else if (input >= 8 && input <= 30) {
			//maxAmps
			maxAmps = input;
			//console.log('maxAmps is now ' + input);
		} else if (input > 999) {
			// current
			amperage = input;
			kiloWatts = (amperage/1000)*120
			//console.log('kiloWatts is now ' + kiloWatts);
		}
	}
}

var send = {
	//sends values to the Logios Database
	toLogiosDB: function (id, plug, power) {
		options.path = '/WebService_PV_Power/PV_Power/' + id + '/' + plug + '/' + power

		http.request(options, function(response) {
			var str = '';
		
			//another chunk of data has been recieved, so append it to `str`
			response.on('data', function (chunk) {
				str += chunk;
			});
		
			//the whole response has been recieved, so we just print it out here
			response.on('end', function () {
				
				parseString(str, function (err, result) {
					console.log('***Server Updates***');
					//Error
					console.log('error: ' + result.Response.Terminal[0].Value[0]);
					//EV_Power_actual
					console.log('EVpower: ' + result.Response.Terminal[1].Value[0]);
					//PV_Power_kW
					console.log('genPower: ' + result.Response.Terminal[3].Value[0]);
					console.log('********************\n\r');
				});
		
			});
		}).end();
	},

	//sends values to node-hive.io
	toNodeHive: function (plug, power) {

	},

	//takes an input and writes it to the appropriate position in the log csv
	toLog: function (input){
		if (input > 0 && input < 5) {
			// 1 = not connected, 2 = ready, 3 = charge, 4 = vent
			//console.log('state = ' + input)
			fs.appendFile(fileName, get.time() + ', ' + input + ',,\r\n');
		} else if (input >= 8 && input <= 30) {
			//maxAmps
			//console.log('maxAmps = ' + input)
			fs.appendFile(fileName, get.time() + ',, ' + input + ',\r\n');
		} else if (input > 999) {
			// current
			//console.log('current = ' + input)
			fs.appendFile(fileName, get.time() + ',,, ' + input + '\r\n');
		}
	}
}

var get = {

	// Update EV charge state
	// retrieves state value from openEVSE and put it in the local "evState" variable
	// 1 = not connected, 2 = ready, 3 = charge, 4 = vent, 5 & 6 = error
	chargeState: function(){
		serialPort.write("$GS*BE\r\n", function(err, results) {});
	},

	//double check to make sure the "setMaxAmps" function is working
	maxAmps: function(){
		serialPort.write("$GE*B0\r\n", function(err, results) {});
	},

	//retrieve current consumption in miliamps
	current: function(){
		serialPort.write("$GG*B2\r\n", function(err, results) {});
	},
	//returns how many milliseconds since 1970/01/01
	time: function(){
		return new Date().getTime();
	}

}

//*****************************************************************************************

var q = async.queue(function (task, cb) {
	task.name.call(null, task.data);
	setTimeout(function(){
		if(cb && !_.isUndefined(cb)){
			cb();		
		}	
	}, intervalTime)
}, 1);

var processIncomingSerialportData = function(data) {
	data = data.toString();
	var dataSplit = data.split(" ");
	var splitCase = parseInt(dataSplit[1]);
	if(data.length > 3 && dataSplit.length > 1){
		console.log("***Serial Read***");
		console.log("data: " + data);
		console.log('value: ' + splitCase);
		console.log("*****************\n\r");
		send.toLog(splitCase);
		set.localVars(splitCase);
		send.toLogiosDB(nodeNumber, evState, kiloWatts);
	}	
}

var SerialPort = require("serialport").SerialPort;

var serialPort = new SerialPort("/dev/ttyUSB0", {
	baudrate: 115200,
	dataCallback: processIncomingSerialportData
});

//******************************************************************************

serialPort.on("open", function () {

	var mainInterval = setInterval(function(){

		q.push({ name: set.maxAmps, data: maxAmps});
		q.push({ name: get.chargeState });
		q.push({ name: get.maxAmps });
		q.push({ name: get.current });

	}, intervalTime);
		
});

