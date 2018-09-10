
const dispatcher = require('pubsub-js');
var ButtonManager = require('./js/ButtonManager.js')
var BCTManager = require('./js/BCTManager.js')

dispatcher.immediateExceptions = true;

function DemoManager(dispatcher) {
    this.demos = { faceDetectionStandalone: this.faceDetectionStandalone, objectDetectionStandalone: this.objectDetectionStandalone};
    this.state = { demoRunning: false, demoSelected: null }

    faceDetectionStandalone = function() {        
dispatcher.publish('runTask', {name: 'face_recognize', mode: 'single'});
    }

    objectDetectionStandalone = function () {
        dispatcher.publish('runTask', { name: 'objectDetection', mode: 'single' });
    }

    this.runDemo = function () {
        console.log("Got request to run demo")
        objectDetectionStandalone()
    }

    onLongPress = function (_, meta) {
        this.state.demoRunning = !(this.state.demoRunning)
        if (this.state.demoRunning) {
            this.runDemo()
        }
        else {
            dispatcher.publish("stopTask")
        }

    }

    dispatcher.subscribe('runDemo', this.runDemo)
    dispatcher.subscribe('LongPress', onLongPress.bind(this))
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
    this.state = { demoRunning: false }

    //Spawn a python process to be ready to run tasks 
    pyshell = new PythonShell('python_manager.py', options);
    pyshell.send("Test signal")
    pyshell.on('message', function (message) {
        console.log(message)
    });
    pyshell.on('close', function () {
        console.log("Python manager has closed!")
    })

    pyshell.on('error', function (error){
        console.log(error)

    })

    recognizeFace = function () {
        console.log("recognising faces")
    }

    takePicture = function() {
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

    stopTask = function () {
        console.log("Signalling to pyshell to stop current task")
        pyshell.send("stopTask")
    }
    dispatcher.subscribe('stopTask', stopTask)
    dispatcher.subscribe('runTask', runTask)
    
}




const demoManager = new DemoManager(dispatcher)
const taskManager = new TaskManager(dispatcher)
const BtnManager = new ButtonManager(dispatcher)

// const BctManager = new BCTManager(dispatcher)
// dispatcher.publish('runDemo', {name: 'objectDetectionStandalone'});
// dispatcher.publish('runTask', { name: 'takePicture' });
// dispatcher.publish('playText', 'talk it like you walk it');




