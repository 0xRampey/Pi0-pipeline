#!/usr/bin/python3

# ****************************************************************************
# Copyright(c) 2017 Intel Corporation. 
# License: MIT See LICENSE file in root directory.
# ****************************************************************************

# Detect objects on a LIVE camera feed using
# Intel® Movidius™ Neural Compute Stick (NCS)

import os
import cv2
import sys
import numpy
import ntpath
import argparse
import picamera

import mvnc.mvncapi as mvnc

import threading

from objectDetector.utils import visualize_output
from objectDetector.utils import deserialize_output

# Detection threshold: Minimum confidance to tag as valid detection
CONFIDANCE_THRESHOLD = 0.60 # 60% confidant

ARGS = None
# OpenCV object for video capture
camera               = None
cont_mode = True

# ---- Step 1: Open the enumerated device and get a handle to it -------------

def open_ncs_device():

    # Look for enumerated NCS device(s); quit program if none found.
    devices = mvnc.EnumerateDevices()
    if len( devices ) == 0:
        print( "No devices found" )
        quit()

    # Get a handle to the first enumerated device and open it
    device = mvnc.Device( devices[0] )
    device.OpenDevice()

    return device

# ---- Step 2: Load a graph file onto the NCS device -------------------------

def load_graph( device ):

    # Read the graph file into a buffer
    with open( ARGS.graph, mode='rb' ) as f:
        blob = f.read()

    # Load the graph buffer into the NCS
    graph = device.AllocateGraph( blob )

    return graph

# ---- Step 3: Pre-process the images ----------------------------------------

def pre_process_image( frame ):

    # Resize image [Image size is defined by choosen network, during training]
    img = cv2.resize( frame, tuple( ARGS.dim ) )

    # Mean subtraction & scaling [A common technique used to center the data]
    img = img.astype( numpy.float16 )
    img = ( img - numpy.float16( ARGS.mean ) ) * ARGS.scale

    return img

# ---- Step 4: Read & print inference results from the NCS -------------------

def infer_image( graph, img, frame, labels ):

    # Load the image as a half-precision floating point array
    graph.LoadTensor( img, 'user object' )

    # Get the results from NCS
    output, userobj = graph.GetResult()

    # Get execution time
    inference_time = graph.GetGraphOption( mvnc.GraphOption.TIME_TAKEN )

    # Deserialize the output into a python dictionary
    output_dict = deserialize_output.ssd( 
                      output, 
                      CONFIDANCE_THRESHOLD, 
                      frame.shape )

    # Print the results (each image/frame may have multiple objects)
    print( "I found these objects in "
            + " ( %.2f ms ):" % ( numpy.sum( inference_time ) ) )

    detection_str=""        

    for i in range( 0, output_dict['num_detections'] ):
        print( "%3.1f%%\t" % output_dict['detection_scores_' + str(i)] 
               + labels[ int(output_dict['detection_classes_' + str(i)]) ]
               + ": Top Left: " + str( output_dict['detection_boxes_' + str(i)][0] )
               + " Bottom Right: " + str( output_dict['detection_boxes_' + str(i)][1] ) )
        label = labels[ int(output_dict['detection_classes_' + str(i)]) ].split(':')[1]
        detection_str += "a%s," % (label)

        # Draw bounding boxes around valid detections 
        (y1, x1) = output_dict.get('detection_boxes_' + str(i))[0]
        (y2, x2) = output_dict.get('detection_boxes_' + str(i))[1]

        # Prep string to overlay on the image
        display_str = ( 
                labels[output_dict.get('detection_classes_' + str(i))]
                + ": "
                + str( output_dict.get('detection_scores_' + str(i) ) )
                + "%" )

        frame = visualize_output.draw_bounding_box( 
                       y1, x1, y2, x2, 
                       frame,
                       thickness=4,
                       color=(255, 255, 0),
                       display_str=display_str )
    print( '\n' )
    
    if(not cont_mode):
        template_str = "playMessage: I found "
        if(detection_str):
            print(template_str + detection_str)
        else:
            print(template_str + "no objects.")
    else:
        # If a display is available, show the image on which inference was performed
        if 'DISPLAY' in os.environ:
            cv2.imshow( 'NCS live inference', frame )
            cv2.waitKey(5)

# ---- Step 5: Unload the graph and close the device -------------------------

def close_ncs_device( device, graph, camera ):
    graph.DeallocateGraph()
    device.CloseDevice()
    print("Releasing camera!")
    camera.close()
    print("Destroying all windows!")
    cv2.destroyAllWindows()

# ---- Main function (entry point for this script ) --------------------------

def main(continous_mode = True):
    global ARGS
    ARGS = parseArgs()

    global cont_mode
    cont_mode = continous_mode
    # Load the labels file
    labels = [line.rstrip('\n') for line in
              open(ARGS.labels) if line != 'classes\n']
    
    # Create a VideoCapture object
    camera = picamera.PiCamera()

    # Set camera resolution
    camera.resolution = (640, 480)
    print("Camera ready!")

    device = open_ncs_device()
    graph = load_graph( device )

    #Get reference to current thread running this task
    thread = threading.currentThread()

    # Main loop: Capture live stream & send frames to NCS
    while(getattr(thread, "run_state")):
        frame = numpy.empty((480, 640, 3), dtype=numpy.uint8)
        print("Capturing image.")
        # Grab a single frame of video from the RPi camera as a np array
        camera.capture(frame, format="bgr")
        img = pre_process_image( frame )
        infer_image( graph, img, frame, labels )
        if(not cont_mode):
            break 
    
    close_ncs_device( device, graph, camera )
    print("All resources released")

# ---- Define 'main' function as the entry point for this script -------------

def parseArgs():

    parser = argparse.ArgumentParser(
                         description="Detect objects on a LIVE camera feed using \
                         Intel® Movidius™ Neural Compute Stick." )

    parser.add_argument( '-g', '--graph', type=str,
                         default='python/objectDetector/data/graph',
                         help="Absolute path to the neural network graph file." )

    parser.add_argument( '-v', '--video', type=int,
                         default=0,
                         help="Index of your computer's V4L2 video device. \
                               ex. 0 for /dev/video0" )

    parser.add_argument( '-l', '--labels', type=str,
                         default='python/objectDetector/data/labels.txt',
                         help="Absolute path to labels file." )

    parser.add_argument( '-M', '--mean', type=float,
                         nargs='+',
                         default=[127.5, 127.5, 127.5],
                         help="',' delimited floating point values for image mean." )

    parser.add_argument( '-S', '--scale', type=float,
                         default=0.00789,
                         help="Absolute path to labels file." )

    parser.add_argument( '-D', '--dim', type=int,
                         nargs='+',
                         default=[300, 300],
                         help="Image dimensions. ex. -D 224 224" )

    parser.add_argument( '-c', '--colormode', type=str,
                         default="bgr",
                         help="RGB vs BGR color sequence. This is network dependent." )

    ARGS = parser.parse_args()
    return ARGS

if __name__ == "__main__":
    main()
    sys.exit()
# ==== End of file ===========================================================
