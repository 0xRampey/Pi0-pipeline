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
from face_matcher import face_matcher 
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
tasks = {"stopTask": stop_task, 
          "takePicture": take_pic.main, 
          "detectObjects": detectObjects.main,
          "matchFaces": face_matcher.main}
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
  


def processLine(line):
  # Remove all spaces present in the line
  line = "".join(line.split())
  print('read input:', line)
  command = line.split('.')
  if(len(command) > 1):
    task, mode = (command[0], command[1])
  else:
    task, mode = (command[0], None)
  print(task, mode)
  return (task, mode)


# If there's input ready, do something, else do something
# else. Note timeout is zero so select won't block at all.
print("Python manager ready to rumble!")
while(True):
    line = sys.stdin.readline()
    if line:
      task, mode = processLine(line)
      if task in tasks:
        if task != "stopTask":
          taskFunc = None
          if(mode == 'single'):
            # Set continuous mode flag "off"
            taskFunc = lambda: tasks[task](False)
          else:
            taskFunc = lambda: tasks[task](True)
          thread = threading.Thread(target=taskFunc)
          thread.run_state = True
          thread.start()
          print(thread)
          print("Process has started", line)
        else:
          print("We got to stop task")
          tasks[task](thread)

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



