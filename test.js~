
var nodeNumber = process.env.POWERPI || 0;
console.log('Node number started ', nodeNumber);

/*
var path = require('path');
var Reporter = require(path.join(__dirname, 'lib', 'node_socket'));
var reporter = new Reporter(nodeNumber);
var io = reporter.io;

var request = require('request'),
    
*/
var _ = require('lodash');

var SerialPort = require("/home/pi/node_modules/serialport").SerialPort
var serialPort = new SerialPort("/dev/ttyUSB0", {
  baudrate: 115200
});

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
		
	}
	/*
	//send information to the server
	toServer: function(nodeValue, dataValue, tempValue){
        io.emit('putNodeData', {
            nodeNumber: String(nodeValue),
            reading: {
                time: new Date().getTime(),
                data: dataValue,
                temp: tempValue
            }
        })
    }
	*/
}

var get = {

	//request information from server
	/*
	fromServer: function(){
        var serverUrl = "http://power-meter.herokuapp.com/api/getLastWindReading";
        // options needed in order to send
        var toRecieveOptions = {
            url: serverUrl,
            method: "GET",
            json: true
        };
        // the actual request, with our options
        request(toRecieveOptions, function(err, res, body){
            // show an error if it exists, otherwise do nothing
            if(err){
                console.error(err);
            } else {
		        setReduction(body.wind, body.basePt);
                console.log('Data retrieved from server - ', 'gen: ' + body.wind, 'bspt: ' + body.basePt);
            }
        });
    },
    */

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

//******************************************************************************

serialPort.on("open", function () {
	if(serialPort.isOpen()){
		var mainInterval = setInterval(function(){
			var num = _.random(8,29);
			console.log('setting number: ', num);
			get.current();	
		}, 2000);

		serialPort.on("data", function(data) {
			data = data.toString();
			var dataSplit = data.split(" ");

			if(data.length > 3 && dataSplit.length > 1){
				switch(dataSplit[1]){
					// chargeState
					case dataSplit[1] > 0 && dataSplit[1] < 7:
						break;
					// maxAmps
					case dataSplit[1] < 6:
						break;
					// current
					case dataSplit[1] < 999:
						break;
					default:
						return;
						break;				
				}
			}	
		});
	}	
});



