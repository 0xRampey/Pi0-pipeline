
var PythonShell = require('python-shell');
var options = {
  mode: 'text',
  pythonPath: 'python3',
  pythonOptions: ['-u'],
  scriptPath: 'python/',
};

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function TaskManager(dispatcher) {
    this.tasks={ "takePicture": this.takePicture, "face_recognize": this.recognize_face, "object_detect": this.detectObjects}
    this.state = { demoRunning: false }

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


rl.question("New face(s) found. If you would like to add a new person? (Y/n) \n", (answer) => {
    console.log(`Received ${answer}`)
    command = answer.split(' ')
    console.log(command)
    var query= ''
    var name = ''
    if (command.length > 1) {
        query = command[0]
        name = command[1]
        console.log(query, name)
    }
    if(query == 'Y') {
        console.log("Wofreofo")
        pyshell.send('onBoard.'+name)
    }            
            });


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

    }

    stopTask = function () {
        console.log("Signalling to pyshell to stop current task")
        pyshell.send("stopTask")
    }
    dispatcher.subscribe('stopTask', stopTask)
    dispatcher.subscribe('runTask', runTask)
    
}

module.exports = TaskManager
