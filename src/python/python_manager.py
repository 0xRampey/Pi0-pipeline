import sys
import select
import time
import os
import threading
import time

# Importing tasks and all their dependencies during setup time
print("Loading task dependencies...")
import take_pic
from objectDetector import detectObjects 
# from multiprocessing import Process

#Keeping and managing reference to only one thread at a time
thread = None

def stop_task(thread):
  if (thread):
    print("Activating stop flag")
    thread.run_state = False
    print("Stopped thread", thread)
    # Letting the thread get GCed
    thread = None
  else:
    print("No running thread to stop")

#Mapping of tasks to their respective functions
tasks = {"stopTask": stop_task, "takePicture": take_pic.main, "detectObjects": detectObjects.main}
# def processLines(line):
#   print('read input:', line)
#   if line == "takePicture":
#     process = Process(target=take_pic.main())
#     process.start()
#   elif line == "detectObjects":
#     process = Process(target=detectObjects.main())
#     process.start()
#     print("Process has started")
#   elif line == "stopTask":
#     print("Definitely stopping!")
#     if(process):
#       process.terminate()      
  


# def doit(arg):
#     t = threading.currentThread()
#     while getattr(t, "do_run", True):
#         print("working on %s" % arg)
#         time.sleep(1)
#     print("Stopping as you wish.")

# If there's input ready, do something, else do something
# else. Note timeout is zero so select won't block at all.
print("Python manager ready to rumble!")
while(True):
    line = sys.stdin.readline()
    if line:
      # Remove all spaces present in the line
      line = "".join(line.split())
      print('read input:', line)
      if line in tasks.keys():
        if line != "stopTask":
          thread = threading.Thread(target=tasks[line])
          thread.run_state = True
          thread.start()
          print(thread)
          print("Process has started", line)
        else:
          print("We got to stop task")
          tasks[line](thread)

      # if line == "takePicture":
      #   process = Process(target=take_pic.main())
      #   process.start()
      # elif line == "detectObjects":
      #   print(t)
      #   if not t:
      #     t = threading.Thread(target=detectObjects.main)
      #     t.run_state = True
      #     t.start()
      #     print(t)
      #     print("Process has started")
      #   else:
      #     print("THread already running!")
      # elif line == "stopTask":
      #   print("Received stopTask signal")
      #   print(t)
      #   if (t):
      #     print("Activating stop flag")
      #     t.run_state = False
      #     print(t)
      #     t = None
    else:  # an empty line means stdin has been closed
      print('eof')
      exit(0)    


