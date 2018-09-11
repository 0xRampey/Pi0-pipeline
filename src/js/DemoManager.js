var StateMachine = require('javascript-state-machine');

function DemoManager(dispatcher) {

    this._fsm();
    this.demos = { faceDetectionStandalone: this.faceDetectionStandalone, objectDetectionStandalone: this.objectDetectionStandalone};
    // this.state = { demoRunning: false, demoSelected: null }

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
        //Perform state transition
        this.longpress()
        if (this.state === 'ContinuousDetection') {
            this.runDemo()
        }
        else {
            dispatcher.publish("stopTask")
        }

    }

    dispatcher.subscribe('runDemo', this.runDemo)
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