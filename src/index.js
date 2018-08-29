var events = require('events');
var eventEmitter = new events.EventEmitter(); 

var picEventHandler = function() {
    console.log("Time to take a picture!")
}

eventEmitter.on('takePicture', picEventHandler);
