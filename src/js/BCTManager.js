const {spawn} = require('child_process');

function BCTManager(dispatcher) {
	dispatcher.subscribe('playText', this.playText)
}

BCTManager.prototype.playText = function(_, metatext) {
//	const {spawn} = require('child_process');
	filename = metatext
	playfile = filename + '.wav'
	const ls = spawn('espeak', ['-w', playfile, metatext]);
//	const lz = spawn('aplay', [playfile]);

	ls.stdout.on('data', function(data){
		console.log(`stdout: ${data}`);
		const lz = spawn('aplay', [playfile]);
		lz.stdout.on('data', function(data){
			console.log(`stdout: $(data)`);
		});
	});
//	lz.stdout.on('data', function(data){
//		console.log(`stdout: $(data)`);
//	});	
}

module.exports = BCTManager