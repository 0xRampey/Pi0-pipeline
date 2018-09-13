
const dispatcher = require('pubsub-js');
var ButtonManager = require('./js/ButtonManager.js')
var BCTManager = require('./js/BCTManager.js')
var DemoManager = require('./js/DemoManager.js')
var TaskManager = require('./js/TaskManager.js')
var BluetoothManager = require('./js/BluetoothManager.js')

// Let dispatcher submit any exceptions immediately
dispatcher.immediateExceptions = true;

const demoManager = new DemoManager(dispatcher)
const taskManager = new TaskManager(dispatcher)
const BtnManager = new ButtonManager(dispatcher)

// const BctManager = new BCTManager(dispatcher)
// dispatcher.publish('runDemo', {name: 'objectDetectionStandalone'});
// dispatcher.publish('runTask', { name: 'takePicture' });
dispatcher.subscribe('demoSelected', test);

function test(event,meta){
	console.log(meta)
}




