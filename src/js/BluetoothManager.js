///
var bleno = require('bleno');
var exec = require('child_process').exec;
var path = require( 'path' );
var PythonShell = require('python-shell');
var cp = require('child_process');

var counter = 0;

var CHUNK_SIZE = 20;

var Descriptor = bleno.Descriptor;

var deviceName = 'calvin-visionkit';
var myId = '4afb720a-5214-4337-841b-d5f954214877';
var data = new Buffer('Send me some data to display');
var output = "";
var updateCallback;

var terminalCallback;
var terminalResponse;
var results;
var recognitionText="";
///

var START_CHAR = String.fromCharCode(002); //START OF TEXT CHAR
var END_CHAR = String.fromCharCode(003);   //END OF TEXT CHAR

var recognitionText;

const jsScriptPath = './firebase_upload.js';

function sliceUpResponse(callback, responseText) {
  if (!responseText || !responseText.trim()) return;
  callback(new Buffer(START_CHAR));
  while(responseText !== '') {
	  callback(new Buffer(responseText.substring(0, CHUNK_SIZE)));
	  responseText = responseText.substring(CHUNK_SIZE);
  }
  callback(new Buffer(END_CHAR));
}

function BluetoothManager(dispatcher){
	var terminal = new bleno.Characteristic({
		uuid : '8bacc104-15eb-4b37-bea6-0df3ac364199',
		properties : ['notify','write'],
		onReadRequest : function(offset, callback) {
			console.log("Read request");
			callback(bleno.Characteristic.RESULT_SUCCESS, new Buffer(results).slice(offset));
		},
		onWriteRequest : function(newData, offset, withoutResponse, callback) {
			if(offset) {
				callback(bleno.Characteristic.RESULT_ATTR_NOT_LONG);
			} else {
				var data = newData.toString('utf8');
				console.log("Command received: [" + data + "]");
						if(data =='FaceDetectionActivity'){
							dispatcher.publish("selectDemo", {name: "faceRecognitionStandalone"});
						}
						else if(data == 'ObjectDetectionActivity'){
							dispatcher.publish("selectDemo", {name: "objectDetectionStandalone"});
						}
						callback(bleno.Characteristic.RESULT_SUCCESS);
						terminalResponse = data;
					}
					if (terminalCallback) sliceUpResponse(terminalCallback, terminalResponse);
				
			
		},
		onSubscribe: function(maxValueSize, updateValueCallback) {
		    console.log("onSubscribe called");
	  		console.log("Sending: " + recognitionText);
	  		//pyshell.on('message', function (message) {
			  // received a message sent from the Python script (a simple "print" statement)
			  console.log(message);
			  updateValueCallback(new Buffer(message));
			
	    	
		},
		onUnsubscribe: function() {
			console.log("onUnsubscribe");
			clearInterval(this.intervalId);
		}
	});

	bleno.on('stateChange', function(state) {
		console.log('on -> stateChange: ' + state);
		if (state === 'poweredOn') {
			bleno.startAdvertising(deviceName,[myId]);
		} else {
			bleno.stopAdvertising();
		}
	});

	bleno.on('advertisingStart', function(error) {
		console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));
		if (!error) {
			bleno.setServices([
				new bleno.PrimaryService({
					uuid : myId,
					characteristics : [
						// add characteristics here
						terminal
					]
				})
			]);
			console.log('service added');
		}
	});

	bleno.on('accept', function(clientAddress) {
		dispatcher.publish('BlE Established')
		console.log("Accepted connection from: " + clientAddress);
	});

	bleno.on('disconnect', function(clientAddress) {
		dispatcher.publish('BlE Disconnected')
		console.log("Disconnected from: " + clientAddress);
	});
}




   
module.exports = BluetoothManager
