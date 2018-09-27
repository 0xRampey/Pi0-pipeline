const {spawn} = require('child_process');

function BCTManager(dispatcher) {
	dispatcher.subscribe('playText', this.playText)
	dispatcher.subscribe('playRecording', this.playRecording)
}

BCTManager.prototype.playText = function(_, metatext){
	console.log(metatext);
	filename = metatext
	playfile = 'audio/'+ filename + '.wav'
	const ls = spawn('espeak', [metatext]);
}

BCTManager.prototype.playRecording = function(_, metadata) {
	console.log("Going to play all recordings")
	files = metadata.files
	folder_path = 'audio_recordings/' 
	for (var i=0; i < files.length; i++) {

		file = files[i]
		let record = spawn('aplay', [folder_path + file +'.wav'])
		record.stderr.on('data', function(data) {
			console.log("%s", data)
			});
		}
	}

module.exports = BCTManager
