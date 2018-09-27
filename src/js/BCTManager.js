const {spawn} = require('child_process');

function BCTManager(dispatcher) {
	dispatcher.subscribe('playText', this.playText)
}

BCTManager.prototype.playText = function(_, metatext){
	console.log(metatext);
	filename = metatext
	playfile = 'audio/'+ filename + '.wav'
	const ls = spawn('espeak', ['-w', playfile, metatext]);

	ls.stdout.on('close', function(code){
		const lz = spawn('aplay', [playfile]);
		lz.stdout.on('data', function(data){
		});
	});
}

module.exports = BCTManager
