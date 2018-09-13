var StateMachine = require('javascript-state-machine');

function DemoManager(dispatcher) {

    this.dispatcher = dispatcher
    // Initialize Finite state machine for Demo Manager
    this._fsm();
    this.demos = { 'faceRecognitionStandalone': this.faceRecognitionStandalone, 'objectDetectionStandalone': this.objectDetectionStandalone};
    // Let default demo be Object detection
    this.demoSelected = this.demos['faceRecognitionStandalone']
    // this.state = { demoRunning: false, demoSelected: null }
    
    dispatcher.subscribe('runDemo', this.runDemo.bind(this))
    dispatcher.subscribe('LongPress', this.onLongPress.bind(this))
    dispatcher.subscribe('Click', this.onClick.bind(this))
}

DemoManager.prototype = {
    faceRecognitionStandalone : function (mode) {
            this.dispatcher.publish('runTask', {
                name: 'face_recognize',
                mode: mode
            });
        },
        
    onLongPress : function (_, meta) {
        // LongPress required only for object detection
        if (this.demoSelected == this.demos['objectDetectionStandalone']) {
        //Perform state transition
        this.longpress()
        if (this.state === 'ContinuousDetection') {
            this.runDemo()
        } else {
            this.dispatcher.publish("stopTask")
        }
    }

    },
    objectDetectionStandalone : function (mode) {
        this.dispatcher.publish('runTask', {
            name: 'objectDetection',
            mode: mode
        });
    },

    runDemo : function (mode) {
        console.log("Got request to run demo")
        this.demoSelected(mode)
    },

    onClick : function () {
        // If not in the right state, do not do anything
        if (this.state == "OneTimeDetection")
        {
            console.log("Activate one time object detection!")
            this.runDemo('single')
        }
        }
    }


// Apply state graph
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
        
    ]
});


module.exports = DemoManager