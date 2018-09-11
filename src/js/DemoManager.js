var StateMachine = require('javascript-state-machine');

function DemoManager(dispatcher) {

    // Initialize Finite state machine for Demo Manager
    this._fsm();
    this.demos = { 'faceRecognitionStandalone': this.faceRecognitionStandalone, 'objectDetectionStandalone': this.objectDetectionStandalone};
    // Let default demo be Object detection
    this.demoSelected = demos['objectDetectionStandalone']
    // this.state = { demoRunning: false, demoSelected: null }

    faceRecognitionStandalone = function() {        
dispatcher.publish('runTask', {name: 'face_recognize', mode: 'single'});
    }

    objectDetectionStandalone = function () {
        dispatcher.publish('runTask', { name: 'objectDetection', mode: 'single' });
    }

    runDemo = function () {
        console.log("Got request to run demo")
        demoSelected()
    }

    onLongPress = function (_, meta) {
        //Perform state transition
        this.longpress()
        if (this.state === 'ContinuousDetection') {
            this.runDemo()
        }
        else {
            dispatcher.publish("stopTask")
        }

    }

    onClick = function() {
        this.click()
        if(this.state === 'OneTimeRunning') {
            console.log("Activate one time object detection!")
        }
    }

    dispatcher.subscribe('runDemo', runDemo.bind(this))
    dispatcher.subscribe('LongPress', onLongPress.bind(this))
}

StateMachine.factory(DemoManager, {
    init: 'OneTimeDetection',
    transitions: [
        {
            name: 'longpress',
            from: 'OneTimeDetection',
            to: 'ContinuousDetection'
        },
        {
            name: 'longpress',
            from: 'ContinuousDetection',
            to: 'OneTimeDetection'
        },
        {
            name: 'click',
            from: 'OneTimeDetection',
            to: 'OneTimeRunning'
        },
        {
            name: 'click',
            from: 'OneTimeRunning',
            to: 'OneTimeDetection'
        }
        
    ]
});


module.exports = DemoManager