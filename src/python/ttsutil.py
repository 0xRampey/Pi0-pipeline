import subprocess

def textToWav(text, file_name):
	subprocess.call(["espeak", "-w"+file_name+".wav", text])

#textToWav('good morning', 'morning')
