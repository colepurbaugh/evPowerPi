
var nodeNumber = 0;


var _ = require('lodash'),
	async = require('async');

var fs = require('fs'),
	fileName = '//root/Desktop/data' + new Date().getTime() + '.csv',
	header = 'timestamp, maxAmps, current,\r\n',
	intervalTime = 1000;

var evState = 0,
	maxAmps = 8,
	amperage = 0,
	intervalTime = 5000,
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

var process = function(data) {
	data = data.toString();
	var dataSplit = data.split(" ");
	var splitCase = parseInt(dataSplit[1]);
	if(data.length > 3 && dataSplit.length > 1){
		if (splitCase > 1000) {
			amperage = splitCase;
		}
		console.log("***Serial Read***");
		console.log("data: " + data);
		console.log('value: ' + splitCase);
		console.log("*****************\n\r");
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
		if (maxAmps <= 16) {
			set.maxAmps(maxAmps);
			maxAmps++;
		} else {
			maxAmps = 8;
		}
		get.current();
		fs.appendFile(fileName, get.time() + ',' + maxAmps + ', ' + amperage + ',\r\n');
	}, intervalTime);
		
});

