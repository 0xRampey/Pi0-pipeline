import sys
import select
import time

def something(line):
  print('read input:', line, end='')
  sys.stdout.flush()


def something_else():
  print('no input')


# If there's input ready, do something, else do something
# else. Note timeout is zero so select won't block at all.
print("Starting to look")
while(True):
    line = sys.stdin.readline()
    if line:
      something(line)
    else:  # an empty line means stdin has been closed
      print('eof')
      exit(0)   

#   else:
#     something_else()
