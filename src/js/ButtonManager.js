var buttons = require('rpi-gpio-buttons')([8]);

function ButtonManager (dispatcher) {
    console.log("Button manager up")
    buttons.on('clicked', function (pin) {
        console.log("Button click!")
        dispatcher.publish('ButtonPress')
        
    });
    buttons.on('pressed', function (pin) {
        console.log("Button press!")
        dispatcher.publish('LongPress');
    });

}

module.exports = ButtonManager