
const dispatcher = require('pubsub-js');
var ButtonManager = require('./js/ButtonManager.js')
var BCTManager = require('./js/BCTManager.js')
var DemoManager = require('./js/DemoManager.js')
var TaskManager = require('./js/TaskManager.js')

// Let dispatcher submit any exceptions immediately
dispatcher.immediateExceptions = true;

const demoManager = new DemoManager(dispatcher)
const taskManager = new TaskManager(dispatcher)
const BtnManager = new ButtonManager(dispatcher)

// const BctManager = new BCTManager(dispatcher)
// dispatcher.publish('runDemo', {name: 'objectDetectionStandalone'});
// dispatcher.publish('runTask', { name: 'takePicture' });
// dispatcher.publish('playText', 'talk it like you walk it');




