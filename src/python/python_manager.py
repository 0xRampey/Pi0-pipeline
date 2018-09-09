import sys
import select
import time
import os

# Importing tasks and all their dependencies during setup time
import take_pic
from objectDetector import detectObjects 

def process(line):
  print('read input:', line, end='')
  if line == "takePicture":
    take_pic.main()
  elif line == "detectObjects":
    detectObjects.main()
  

# If there's input ready, do something, else do something
# else. Note timeout is zero so select won't block at all.
print("Python manager waiting for stdin")
while(True):
    line = sys.stdin.readline()
    if line:
      # Remove all spaces present in the line
      line = "".join(line.split())
      process(line)
    else:  # an empty line means stdin has been closed
      print('eof')
      exit(0)    

#   else:
#     something_else()
