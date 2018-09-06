import os
from ttsutil import textToWav
#os.system("aplay ''")
filename = 'morning'
playfile = filename + '.wav'
textToWav('good morning', filename)
os.system("aplay " + playfile)
