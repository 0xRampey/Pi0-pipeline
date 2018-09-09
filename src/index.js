var events = require('events');
var eventEmitter = new events.EventEmitter(); 
const dispatcher = require('pubsub-js');
var ButtonManager = require('./js/ButtonManager.js')
var BCTManager = require('./js/BCTManager.js')

dispatcher.immediateExceptions = true;

function DemoManager(dispatcher) {
    this.demos = { faceDetectionStandalone: this.faceDetectionStandalone, objectDetectionStandalone: this.objectDetectionStandalone};
    faceDetectionStandalone = function() {        
dispatcher.publish('runTask', {name: 'face_recognize', mode: 'single'});
    }

    objectDetectionStandalone = function () {
        dispatcher.publish('runTask', { name: 'objectDetection', mode: 'single' });
    }

    this.runDemo = function (_, demo) {
        console.log("Got request to run demo", demo)

        if (demo.name === 'FaceDetectionStandalone') {
            this.faceDetectionStandalone()
        }
        if (demo.name === 'objectDetectionStandalone') {
            objectDetectionStandalone()
        }

    }

    dispatcher.subscribe('runDemo', this.runDemo)
    dispatcher.subscribe('LongPress', this.onLongPress)
}



DemoManager.prototype.onLongPress = function (_, meta) {

    console.log("Long press in demo")

}


var PythonShell = require('python-shell');
var options = {
  mode: 'text',
  pythonPath: 'python3',
  pythonOptions: ['-u'],
  scriptPath: 'python/',
};

function TaskManager(dispatcher) {
    this.tasks={ "takePicture": this.takePicture, "face_recognize": this.recognize_face, "object_detect": this.detectObjects}

    pyshell = new PythonShell('python_manager.py', options);
    pyshell.send("evrv")
    pyshell.on('message', function (message) {
        console.log(message)
    });
    pyshell.on('close', function () {
        console.log("Manager closed!")
    })

    pyshell.on('error', function (error){
        console.log(error)

    })

    recognizeFace = function () {
        console.log("recognising faces")
    }

    this.takePicture = function() {
        console.log("Sending message to pyshell now")
        pyshell.send('takePicture')
    }

    detectObjects = function () {
        console.log("Sending message to pyshell now")
        pyshell.send('detectObjects')
    }

    runTask = function (_, data) {
        console.log("Going to run a task!")
        if (data.name === 'face_recognize') {
            this.recognizeFace();
        }
        if (data.name === 'objectDetection') {
            this.detectObjects()
        }
        if (data.name === 'takePicture') {
            console.log("Time to take a picture")
            this.takePicture()
        }

    }
    dispatcher.subscribe('runTask', runTask)
    dispatcher.subscribe('LongPress', this.takePicture)
}




const demoManager = new DemoManager(dispatcher)
const taskManager = new TaskManager(dispatcher)
const BtnManager = new ButtonManager(dispatcher)
// const BctManager = new BCTManager(dispatcher)
dispatcher.publish('runDemo', {name: 'objectDetectionStandalone'});
// dispatcher.publish('playText', 'talk it like you walk it');





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


