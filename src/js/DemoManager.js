var StateMachine = require('javascript-state-machine');

function DemoManager(dispatcher) {

    this.dispatcher = dispatcher
    // Initialize Finite state machine for Demo Manager
    this._fsm();
    this.demos = { 'faceRecognitionStandalone': this.faceRecognitionStandalone, 'objectDetectionStandalone': this.objectDetectionStandalone};
    // Let default demo be Object detection
    this.demoSelected = this.demos['objectDetectionStandalone']
    // this.state = { demoRunning: false, demoSelected: null }
    
    dispatcher.subscribe('runDemo', this.runDemo.bind(this))
    dispatcher.subscribe('LongPress', this.onLongPress.bind(this))
}

DemoManager.prototype = {
    faceRecognitionStandalone : function () {
            dispatcher.publish('runTask', {
                name: 'face_recognize',
                mode: 'single'
            });
        },
    onLongPress : function (_, meta) {
        //Perform state transition
        this.longpress()
        if (this.state === 'ContinuousDetection') {
            this.runDemo()
        } else {
            this.dispatcher.publish("stopTask")
        }

    },
    objectDetectionStandalone : function () {
        this.dispatcher.publish('runTask', {
            name: 'objectDetection',
            mode: 'single'
        });
    },

    runDemo : function () {
        console.log("Got request to run demo")
        this.demoSelected()
    },

    onClick : function () {
        this.click()
        if (this.state === 'OneTimeRunning') {
            console.log("Activate one time object detection!")
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