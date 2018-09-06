var buttons = require('rpi-gpio-buttons')([8]);

buttons.setTiming({
    pressed: 2000, // Longpress for 2 seconds
    debounced: 1000,
    clicked: 500
});

function ButtonManager (dispatcher) {
    console.log("Button manager up")
    // buttons.on('clicked', function (pin) {
    //     console.log("Button click!")
    //     dispatcher.publish('ButtonClick')
        
    // });
    // buttons.on('double_clicked', function (pin) {
    //     console.log('User double clicked button on pin ', pin);
    // });

    buttons.on('pressed', function (pin) {
        console.log("Long press!")
        dispatcher.publish('LongPress');
    });

}

module.exports = ButtonManager