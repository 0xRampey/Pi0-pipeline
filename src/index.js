var events = require('events');
var eventEmitter = new events.EventEmitter(); 
const dispatcher = require('pubsub-js');
var ButtonManager = require('./js/ButtonManager.js')

function DemoManager(dispatcher) {
    this.demos = { faceDetectionStandalone: this.faceDetectionStandalone, ObjectDetectionStandalone: null};
    faceDetectionStandalone = function() {        
dispatcher.publish('runTask', {name: 'face_recognize', mode: 'single'});
    }
    dispatcher.subscribe('runDemo', this.runDemo)
}

DemoManager.prototype.runDemo = function(_, demo) {

    if(demo.name === 'FaceDetectionStandalone') {
        faceDetectionStandalone()
    }

}

function TaskManager(dispatcher) {
    this.tasks={ "face_recognize": this.recognize_face, "object_detect": this.detect_objects}

    recognizeFace = function () {
        console.log("recognising faces")
    }

    detect_objects = function () {
        console.log("detecting objects")
    }
    dispatcher.subscribe('runTask', this.runTask)
}

TaskManager.prototype.runTask = function (_, data) {
    if(data.name === 'face_recognize') {
        this.recognizeFace();
    }
    if (data.name === 'object_detect') {
        this.detect_objects()
    }
    
}

const demoManager = new DemoManager(dispatcher)
const taskManager = new TaskManager(dispatcher)
const BtnManager = new ButtonManager(dispatcher)
dispatcher.publish('runDemo', { name: 'FaceDetectionStandalone'})






// class MyEmitter extends events.EventEmitter { }

// const myEmitter = new MyEmitter();
// myEmitter.on('event', () => {
//     console.log('an event occurred!');
// });

// var picEventHandler = function () {
//     console.log("Time to take a picture!")
// }

// eventEmitter.on('event', picEventHandler);

// myEmitter.emit('event');


