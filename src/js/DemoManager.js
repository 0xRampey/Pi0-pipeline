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

module.exports = DemoManager