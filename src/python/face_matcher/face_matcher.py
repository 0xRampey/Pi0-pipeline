#! /usr/bin/env python3

# Copyright(c) 2017 Intel Corporation. 
# License: MIT See LICENSE file in root directory.


from mvnc import mvncapi as mvnc
import numpy as np
import cv2
import picamera
import sys
import os
import face_recognition
import pickle
import time
import shutil
# import classifier_onboarding

GRAPH_FILENAME = "python/face_matcher/facenet_celeb_ncs.graph"

BUTTON_GPIO_PIN = 24

MODEL_PATH = 'python/face_matcher/models/knn_model.clf'

CAMERA_INDEX = 0
REQUEST_CAMERA_WIDTH = 640
REQUEST_CAMERA_HEIGHT = 480

# the same face will return 0.0
# different faces return higher numbers
# this is NOT between 0.0 and 1.0
FACE_MATCH_THRESHOLD = 0.8


# Run an inference on the passed image
# image_to_classify is the image on which an inference will be performed
#    upon successful return this image will be overlayed with boxes
#    and labels identifying the found objects within the image.
# ssd_mobilenet_graph is the Graph object from the NCAPI which will
#    be used to peform the inference.
def run_inference(image_to_classify, facenet_graph):

    # ***************************************************************
    # Send the image to the NCS
    # ***************************************************************
    facenet_graph.LoadTensor(image_to_classify.astype(np.float16), None)

    # ***************************************************************
    # Get the result from the NCS
    # ***************************************************************
    output, userobj = facenet_graph.GetResult()

    return output

## Returns any detected face locations for a video frame
def get_face_loc(vid_frame):
    face_locations = face_recognition.face_locations(vid_frame)
    print("I found {} face(s) in this photograph.".format(len(face_locations)))
    return face_locations

def new_coord(top, right, bottom, left):
    width = right - left
    height = bottom - top
    top = int(top - height/8)
    bottom = int(bottom + height/8)
    left = int(left - width/8)
    right = int(right + width/8)
    print(top, right, bottom, left)
    return (top, right, bottom, left)

## Extracts cropped face images from a video frame based on the face location coordinates given to it
def extract_faces(vid_frame, face_locations):
    face_img_list=[]
    for face_location in face_locations:

       # Print the location of each face in this image
      top, right, bottom, left = face_location
      print("A face is located at pixel location Top: {}, Left: {}, Bottom: {}, Right: {}".format(top, left, bottom, right))

      top, right, bottom, left = new_coord(top, right, bottom, left)


      # You can access the actual face itself like this:
      face_image = vid_frame[top:bottom, left:right]
      face_img_list.append(face_image)
    return face_img_list

# whiten an image
def whiten_image(source_image):
    source_mean = np.mean(source_image)
    source_standard_deviation = np.std(source_image)
    std_adjusted = np.maximum(source_standard_deviation, 1.0 / np.sqrt(source_image.size))
    whitened_image = np.multiply(np.subtract(source_image, source_mean), 1 / std_adjusted)
    return whitened_image

# create a preprocessed image from the source image that matches the
# network expectations and return it
def preprocess_image(src):
    # scale the image
    NETWORK_WIDTH = 160
    NETWORK_HEIGHT = 160
    preprocessed_image = cv2.resize(src, (NETWORK_WIDTH, NETWORK_HEIGHT))

    #whiten
    preprocessed_image = whiten_image(preprocessed_image)

    # return the preprocessed image
    return preprocessed_image

# determine if two images are of matching faces based on the
# the network output for both images.
def face_match(face1_output, face2_output):
    if (len(face1_output) != len(face2_output)):
        print('length mismatch in face_match')
        return False
    total_diff = 0
    for output_index in range(0, len(face1_output)):
        this_diff = np.square(face1_output[output_index] - face2_output[output_index])
        total_diff += this_diff
    print('Face threshold difference is: ' + str(total_diff))

    if (total_diff < FACE_MATCH_THRESHOLD):
        # the total difference between the two is under the threshold so
        # the faces match.
        return True

    # differences between faces was over the threshold above so
    # they didn't match.
    return False

# handles key presses
# raw_key is the return value from cv2.waitkey
# returns False if program should end, or True if should continue
def handle_keys(raw_key):
    ascii_code = raw_key & 0xFF
    if ((ascii_code == ord('q')) or (ascii_code == ord('Q'))):
        return False

    return True


def predict(face_encodings, distance_threshold):
    """
    Recognizes faces in given image using a trained KNN classifier
    :param X_img_path: path to image to be recognized
    :param knn_clf: (optional) a knn classifier object. if not specified, model_save_path must be specified.
    :param model_path: (optional) path to a pickled knn classifier. if not specified, model_save_path must be knn_clf.
    :param distance_threshold: (optional) distance threshold for face classification. the larger it is, the more chance
           of mis-classifying an unknown person as a known one.
    :return: a list of names and face locations for the recognized faces in the image: [(name, bounding box), ...].
        For faces of unrecognized persons, the name 'unknown' will be returned.
    """
    with open(MODEL_PATH, 'rb') as f:
            knn_clf = pickle.load(f)

    # Use the KNN model to find the best matches for the test face
    closest_distances = knn_clf.kneighbors(face_encodings, n_neighbors=1)
    are_matches = [closest_distances[0][i][0] <=
                   distance_threshold for i in range(len(face_encodings))]

    # Predict classes and remove classifications that aren't within the threshold
    return [(pred) if rec else ("unknown") for pred, rec in zip(knn_clf.predict(face_encodings), are_matches)]

# start the opencv webcam streaming and pass each frame
# from the camera to the facenet network for an inference
# Continue looping until the result of the camera frame inference
# matches the valid face output and then return.
# valid_output is inference result for the valid image
# validated image filename is the name of the valid image file
# graph is the ncsdk Graph object initialized with the facenet graph file
#   which we will run the inference on.
# returns None
def run_face_rec(camera, graph):
      pic = np.empty((240, 320, 3), dtype=np.uint8)
      print("Capturing image.")
      # Grab a single frame of video from the RPi camera as a np array
      camera.capture(pic, format="rgb")
      counter = 0
      # camera.capture('./Calvin_time.jpg'.format(counter))
      # print('imageUpload: ./0.jpg')
      print("Performing inference!")

      #Extract faces found in the image
      face_locations = get_face_loc(pic)
      face_images = extract_faces(pic, face_locations)

      #Perform inference only when when you detect faces
      if(len(face_images)):

        face_enc_list = []
        for face_idx, face in enumerate(face_images):
          # get a resized version of the image that is the dimensions
          # Facenet expects
          resized_image = preprocess_image(face)
          # run a single inference on the image and overwrite the
          # boxes and labels
          face_enc = run_inference(resized_image, graph)
          face_enc_list.append(face_enc)

        prediction = predict(face_enc_list, FACE_MATCH_THRESHOLD)
        cv2.imwrite('{}.png'.format(prediction[0]),pic)
        write_to_file('{}.png'.format(prediction[0]))
        print("faceUpload: {}.png".format(prediction[0]))
        print('playMessage: ' + array_to_human(prediction))

      else:
        print("playMessage: No faces detected!")


def array_to_human(arr):
    num_unknown = 0
    template = "I found "
    known_faces=""
    for face in arr:
        if(face == 'unknown'):
            num_unknown += 1
        else:
            known_faces += face+","
    if(known_faces):
        if(num_unknown):
            message = "I found %s and %d unknown faces" % (known_faces, num_unknown)
            #add_face()
        else:

            message = "I found %s" % (known_faces)
    else:
        message = "I only found %d unknown faces" % (num_unknown)
    return message

def write_to_file(filename):
    with open("face-filenames.txt", "a") as images:
        images.write(filename+",\n")

def add_face():
    while True:
        new_face = input("New face(s) found. Would you like to add a new person? (Y/n) \n")
        if new_face == 'Y':
            now = datetime.now()
            local_time = now.strftime("%I-%M-%S_%Y-%d-%B")
            new_name = input("What is the person's name?: ")
            path = "./unknown_faces/"+new_name+"/"

            try:  
                os.mkdir(path)
            except OSError:  
                print ("Creation of the directory %s failed" % path)
            else:  
                print ("Successfully created the directory %s " % path)
            for i in range(3,0,-1):
                print("Taking picture in: ", i)
                time.sleep(1)
            for i in range(3):
                now = datetime.now()
                local_time = now.strftime("%I-%M-%S_%Y-%d-%B")
                image_name = "./unknown_faces/"+new_name+"/"+new_name+"_"+local_time+".png"
                camera.capture(image_name)
                print("faceUpload: ", image_name)
                time.sleep(1)
                print("Picture successfully taken")
            if len(os.listdir("./unknown_faces")) == 1:
                classifier = onboarding("./unknown_faces",graph=graph, name=new_name, model_save_path=model_path)
                move_files()
            break
        elif new_face == 'n':
            print('Person not added')
            break
        else:
            continue

def move_files():
    print("Training KNN classifier...")
    if len(os.listdir("./unknown_faces")) == 0:
        print("Directory is empty")
        print('Model already exists')
    else:
        unknown = os.listdir("./unknown_faces")
        destination = "./known_faces"
        for f in unknown:
            shutil.move("./unknown_faces"+'/'+f, destination)
            # print(os.path.join(directory, filename))
        print('All files moved')

def initCamera():
    camera = picamera.PiCamera()
    camera.resolution = (320, 240)
    print("Camera ready!")
    return camera

# This function is called from the entry point to do
# all the work of the program
def main(bool):

    # Get a list of ALL the sticks that are plugged in
    # we need at least one
    devices = mvnc.EnumerateDevices()
    if len(devices) == 0:
        print('No NCS devices found')
        quit()

    # Pick the first stick to run the network
    device = mvnc.Device(devices[0])

    print("Initializing NCS....")
    # Open the NCS
    device.OpenDevice()

    # The graph file that was created with the ncsdk compiler
    graph_file_name = GRAPH_FILENAME

    # read in the graph file to memory buffer
    with open(graph_file_name, mode='rb') as f:
        graph_in_memory = f.read()

    print("Loading graph file into NCS...")
    # create the NCAPI graph instance from the memory buffer containing the graph file.
    graph = device.AllocateGraph(graph_in_memory)

    #Setting up camera and button trigger
    camera = initCamera()

    run_face_rec(camera, graph)

    # Clean up the graph and the device
    camera.close()
    graph.DeallocateGraph()
    device.CloseDevice()


# main entry point for program. we'll call main() to do what needs to be done.
if __name__ == "__main__":
    sys.exit(main())
