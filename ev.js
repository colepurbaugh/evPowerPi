
var nodeNumber = 0;

var _ = require('lodash'),
	async = require('async');

//Setup file system for logs
var fs = require('fs'),
	fileName = '//root/Desktop/data' + new Date().getTime() + '.csv',
	header = 'timestamp, evState, maxAmps, amperage, wattage, error, serverKW \r\n';

//Setup server communication
var parseString = require('xml2js').parseString;
var http = require('http'),
	options = {
		host: '169.237.123.39',
		port: '8080',
		path: '/WebService_PV_Power/PV_Power'
	};

var evState = 0,        //current state the EV is in (0 unplugged, 1 plugged, 2 charging)
	maxAmps = 10,       //the maximum amperage that is set via the logios server
	amperage = 0,       //measured amperage from the EV
	error = 0,          //error state sent from server
	voltage = 120,      //static voltage level to calculate wattage
	localKW = 0,        //measured amperage * static voltage
	serverKW = 0,       //limiting server command. Determines what amperage set to
	intervalTime = 100, //milliseconds between interactions to keep serial connection from choking
	counter = 0,
	//these are serial commands for setting amperage to openevse.  First number is amperage and second number is calculated checksum
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
		if(amps < 8 || amps > 30){
			console.log('maxAmps out of range', amps);
			return false;
		}
		console.log('setting amperage ' + ampsArray[amps - 8]);
		serialPort.write(ampsArray[amps - 8] + "\r\n", function(err, results) {
			if(err && !_.isUndefined(err)){				
				console.log('err ' + err);				
				exit(0);			
			}
		});
	}
}

var update = {

	//writes a new line of data to the log file each function call
	log: function () {
		fs.appendFile(fileName, get.time() + ', ' + evState + ', ' + maxAmps + ', ' + amperage + ', ' + localKW + ', ' + error + ', ' + serverKW + ',\r\n');
	},


	logios: function () {

		options.path = '/WebService_PV_Power/PV_Power/' + nodeNumber + '/' + evState + '/' + localKW

		http.request(options, function(response) {
			var str = '';
		
			//another chunk of data has been recieved, so append it to `str`
			response.on('data', function (chunk) {
				str += chunk;
			});
		
			//the whole response has been recieved, so we just print it out here
			response.on('end', function () {
				
				parseString(str, function (err, result) {
					console.log('\n\r***Recieved from Logios***');
					//Error
					error = result.Response.Terminal[1].Value[0];
					console.log('Error: ' + );
					//PV_Power_kW
					serverKW = result.Response.Terminal[2].Value[0];
					console.log('Charge_Power_kW: ' + serverKW);
					console.log('**************************\n\r');
				});
		
			});
		}).end();
	}
}

var get = {

	// Update EV charge state
	// retrieves state value from openEVSE and put it in the local "evState" variable
	// 1 = not connected, 2 = ready, 3 = charge, 4 = vent, 5 & 6 = error
	evState: function(){
		console.log('retrieving state $GS*BE');
		serialPort.write("$GS*BE\r\n", function(err, results) {});
	},

	//double check to make sure the "setMaxAmps" function is working
	maxAmps: function(){
		console.log('retrieving maxAmps $GE*B0');
		serialPort.write("$GE*B0\r\n", function(err, results) {});
	},

	//retrieve current consumption in miliamps
	evCurrent: function(){
		console.log('retrieving current $GG*B2');
		serialPort.write("$GG*B2\r\n", function(err, results) {});
	},
	//returns how many milliseconds since 1970/01/01
	time: function(){
		return new Date().getTime();
	}

}

//*****************************************************************************************

var process = function(data) {
	data = data.toString();
	var dataSplit = data.split(" ");
	var secondValue = parseInt(dataSplit[1]);
	var thirdValue = parseInt(dataSplit[2]);
	//console.log(data);
	//console.log('second = ' + secondValue);
	//console.log('third = ' + thirdValue);
	//console.log(data.length + ' ' + !isNan(secondValue));
	if(data.length > 3 && !isNaN(secondValue)){
		//console.log("data: " + data);
		if (isNaN(thirdValue)) {
			//set global amperage and wattage
			amperage = secondValue;
			localKW = (secondValue / 1000) * 120;
		} else if (secondValue >= 0 && secondValue <= 5){
			//set global evState
			evState = secondValue;
		} 
	}
}

var SerialPort = require("serialport").SerialPort;

var serialPort = new SerialPort("/dev/ttyUSB0", {
	baudrate: 115200,
	dataCallback: process
});

//******************************************************************************

serialPort.on("open", function () {
	var mainInterval = setInterval(function(){
		console.log('counter ' + counter + ' ********************************');
		switch (counter) {
			case 1:
				//set amperage
				set.maxAmps(maxAmps);
				break;
			case 2:
				//get amperage
				get.evCurrent();
				break;
			case 3:
				//get state
				get.evState();
				break;
			case 4:
				//log collected values
				update.log();
				//update server
				update.logios();
				//reset counter
				counter = 0;
				break;
		}
		counter++;

	}, intervalTime);
		
});

