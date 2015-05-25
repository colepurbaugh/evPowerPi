
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

var dataBufferString = "";

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
			serialPort.on('data', function(data) {
				dataBufferString += data.toString();
				console.log(dataBufferString);
			});
			
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
		
		serialPort.write("$GS*BE\r\n", function(err, results) {
			serialPort.on('data', function(data) {
				evState = data.toString().substring(4,5);
				console.log(evState);
			});
		});
		
	},

	//double check to make sure the "setMaxAmps" function is working
	maxAmps: function(){
		
		serialPort.write("$GE*B0\r\n", function(err, results) {
			//console.log('err ' + err);
			serialPort.on('data', function(data) {
				console.log(data.toString());
			});
		});
		
	},

	//retrieve current consumption in miliamps
	current: function(){
		var counter = 0;
		var tempData;

		
		serialPort.write("$GG*B2\r\n", function(err, results) {
			//console.log('err ' + err);
			serialPort.on('data', function(data){
				tempData = data.toString();
				while (true){
					if (tempData.charAt(5 + counter) == "" || tempData.charAt(5 + counter) == " " || counter > 20){
						console.log(tempData.substring(4, 5 + counter));
						break;
					}else {
						counter++;
					}
				}
			});
		});
		
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
	var num = _.random(8,29);
	console.log('setting number: ', num);
	set.maxAmps(num);	
	//setInterval(function(){
	//	set.maxAmps(_.random(8,29));	
	//}, 20000)
});

//get.chargeState();
//get.maxAmps();
//get.current();

/*
//Sample Working Code
serialPort.on("open", function () {

	console.log('open');

	serialPort.on('data', function(data) {
    	console.log('data received: ' + data);
	});

	serialPort.write("$SC 10*3B\r\n", function(err, results) {
		console.log('err ' + err);
	    console.log('results ' + results);
	});
});

*/
