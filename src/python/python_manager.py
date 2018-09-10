import sys
import select
import time
import os
import threading
import time

# Importing tasks and all their dependencies during setup time
import take_pic
from objectDetector import detectObjects 
from multiprocessing import Process

t = None;

def processLines(line):
  print('read input:', line)
  if line == "takePicture":
    process = Process(target=take_pic.main())
    process.start()
  elif line == "detectObjects":
    process = Process(target=detectObjects.main())
    process.start()
    print("Process has started")
  elif line == "stopTask":
    print("Definitely stopping!")
    if(process):
      process.terminate()      
  

def doit(arg):
    t = threading.currentThread()
    while getattr(t, "do_run", True):
        print("working on %s" % arg)
        time.sleep(1)
    print("Stopping as you wish.")

# If there's input ready, do something, else do something
# else. Note timeout is zero so select won't block at all.
print("Python manager waiting for stdin")
while(True):
    line = sys.stdin.readline()
    if line:
      # Remove all spaces present in the line
      line = "".join(line.split())
      print('read input:', line)
      if line == "takePicture":
        process = Process(target=take_pic.main())
        process.start()
      elif line == "detectObjects":
        t = threading.Thread(target=doit, args=("task",))
        t.start()
        print("Process has started")
      elif line == "stopTask":
        print("Definitely stopping!")
        print(t)
        if(t):
          t.do_run = False
    else:  # an empty line means stdin has been closed
      print('eof')
      exit(0)    



