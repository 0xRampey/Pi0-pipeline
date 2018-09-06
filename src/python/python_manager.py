import sys
import select
import time
# Importing tasks and all their dependencies during setup time
import take_pic

def process(line):
  if line == "takePicture":
      print("Executing")
      take_pic.main()
  print('read input:', line, end='')
  sys.stdout.flush()

# If there's input ready, do something, else do something
# else. Note timeout is zero so select won't block at all.
print("Python manager waiting for stdin")
while(True):
    line = sys.stdin.readline()
    if line:
      sys.stdout.flush()
      # Remove all spaces present in the line
      line = "".join(line.split())
      process(line)
    else:  # an empty line means stdin has been closed
      print('eof')
      exit(0)    

#   else:
#     something_else()
