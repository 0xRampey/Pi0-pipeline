// var buttons = require('rpi-gpio-buttons')([11, 13]);

function ButtonManager (dispatcher) {
    buttons.on('clicked', function (pin) {
        switch (pin) {
            // Up button on pin 11 was clicked
            case 11:
                dispatcher.publish('ButtonPress')
                break
        }
    });
    buttons.on('pressed', function (pin) {
        dispatcher.publish('LongPress');
    });

}

module.exports = ButtonManager