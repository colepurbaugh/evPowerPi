
var nodeNumber = process.env.POWERPI || 0;
console.log('Node number started ', nodeNumber);

var _ = require('lodash'),
	async = require('async');

console.log('program start');

var 	evState,
	maxAmps = 8,
	amperage = 0,
	ampsArray = [
	"$SC 8*12", "$SC 9*13", "$SC 10*3B", "$SC 11*3C", "$SC 12*3D", 
	"$SC 13*3E", "$SC 14*3F", "$SC 15*40", "$SC 16*41", "$SC 17*42", 
	"$SC 18*43", "$SC 19*44", "$SC 20*3C", "$SC 21*3D", "$SC 22*3E", 
	"$SC 23*3F", "$SC 24*40", "$SC 25*41", "$SC 26*42", "$SC 27*43", 
	"$SC 28*44", "$SC 29*45", "$SC 30*3D"];

var set = {

	//variable "amps" must be between 8 and 16 for L1 (120V) 
	//                    and between 8 and 30 for L2 (240V)
	maxAmps: function(amps){
		if(amps <= 7 || amps >= 30){
			return false;
		}
	
		serialPort.write(ampsArray[amps - 8] + "\r\n", function(err, results) {
			if(err && !_.isUndefined(err)){				
				console.log('err ' + err);				
				exit(0);			
			}
		});
		
	},
	toLogFile: function(log){
		require('fs')	
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

	// Status Report shows all current raspberry pi end values for debugging
	statusReport: function () {
		console.log('***Status Report***');
		console.log('maxAmps : ' + maxAmps);
		console.log('amperage : ' + amperage);
		console.log('evState : ' + evState);
		statusReport();	console.log('*******************');
	}

}

var q = async.queue(function (task, cb) {
	task.name.call(null, task.data);
	setTimeout(function(){
		if(cb && !_.isUndefined(cb)){
			cb();		
		}	
	}, 300)
}, 1);

//******************************************************************************
var processIncomingSerialportData = function(data) {
	data = data.toString();
	var dataSplit = data.split(" ");
	if(data.length > 3 && dataSplit.length > 1){
		console.log("DATA INCOMING: ", data);
		switch(dataSplit[1]){
			// chargeState
			case dataSplit[1] > 0 && dataSplit[1] < 7:
				// 1 = not connected, 2 = ready, 3 = charge, 4 = vent, 5 & 6 = error
				break;
			// maxAmps
			case dataSplit[1] < 6:
				break;
			// current
			case dataSplit[1] < 999:
				break;
			default:
				break;				
		}
	}	
}

var SerialPort = require("/home/pi/node_modules/serialport").SerialPort;

var serialPort = new SerialPort("/dev/ttyUSB0", {
	baudrate: 115200,
	dataCallback: processIncomingSerialportData
});

serialPort.on("open", function () {

	var mainInterval = setInterval(function(){
		var num = _.random(8,29);
		//console.log('setting number: ', num);
		q.push({ name: set.maxAmps, data: num});
		q.push({ name: get.chargeState });	
	}, 300);
		
});



