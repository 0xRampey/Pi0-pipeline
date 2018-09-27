
var PythonShell = require('python-shell');
var options = {
  mode: 'text',
  pythonPath: 'python3',
  pythonOptions: ['-u'],
  scriptPath: 'python/',
};

var uniqid = require('uniqid');
const {spawn} = require('child_process');

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function TaskManager(dispatcher) {
    this.tasks={ "takePicture": this.takePicture, "face_recognize": this.recognize_face, "object_detect": this.detectObjects}
    this.state = { demoRunning: false }
    this.dispatcher = dispatcher

    console.log("Spawning Python shell...")
    //Spawn a python process to be ready to run tasks 
    pyshell = new PythonShell('python_manager.py', options);
    pyshell.send("Test signal")
    pyshell.on('message', function (message) {
console.log(message)
        //Look for play messages so that they can be sent to BCTManager
        if (message.startsWith('playMessage:')) {

            message = message.split('playMessage: ')[1]
console.log('This is going to be played!')
console.log(message)
            dispatcher.publish('playText', message)
        }

        if (message.startsWith('unknownFaces:')) {
    
    dispatcher.publish('unknownFace')
    dispatcher.publish('playText', 'New face found. Long press to      add')


        }
        if (message.startsWith('playRecording:')) {


           record_string = message.split('playRecording: ')[1]
           record_files = record_string.split(',')
           console.log("Files are", record_files)
           // Remove last null string
           record_files.pop()
           dispatcher.publish('playRecording', {files: record_files})


        }


    });
    pyshell.on('close', function () {
        console.log("Python manager has closed!")
    })

    pyshell.on('error', function (error){
        console.log(error)

    })

    recognizeFace = function () {
        console.log("recognising faces")
        pyshell.send('matchFaces')
    }

    takePicture = function() {
        console.log("Sending message to pyshell now")
        pyshell.send('takePicture')
    }

    detectObjects = function (mode) {
        console.log("Sending message to pyshell now")
        pyshell.send('detectObjects.'+ mode)
    }

    recordName = () => {
        let once = 0
        let id = uniqid()
        filename = id + '.wav'
        fullPath = 'audio_recordings/' + filename
        // Record and store wav file
        let record = spawn('arecord', ['-D', 'plughw:1,0', fullPath, '-d', 3], {
            stdio: [process.stdin, 'pipe', 'pipe']
        });

        // For some reason, stdout is being thrown as stderr
        record.stderr.on('data', (data) => {
            once += 1
            if( once === 1)
            {
                this.dispatcher.publish('playText', 'Please say the name now')

            }
            
        });

        record.on('close', function (data) {
            console.log("Recording done")
            console.log("Going to onboard:", id)
            pyshell.send('onBoard.' + id)

        });
        
    }

    runTask = function (_, data) {
        console.log("Going to run a task!")
        if (data.name === 'face_recognize') {
            this.recognizeFace();
        }
        if (data.name === 'objectDetection') {
            this.detectObjects(data.mode)
        }
        if (data.name === 'takePicture') {
            console.log("Time to take a picture")
            this.takePicture()
        }
        if (data.name === 'recordName') {
            console.log("Recording name...")
            this.recordName(this)
        }

    }

    stopTask = function () {
        console.log("Signalling to pyshell to stop current task")
        pyshell.send("stopTask")
    }
    dispatcher.subscribe('stopTask', stopTask)
    dispatcher.subscribe('runTask', runTask)
    
}

module.exports = TaskManager
