import math
from sklearn import neighbors
import numpy as np
import os
import cv2
import sys
import os.path
import pickle
import face_recognition
from face_recognition.face_recognition_cli import image_files_in_folder
import shutil
from datetime import datetime
import time
from mvnc import mvncapi as mvnc
import picamera

GRAPH_FILENAME = "python/face_matcher/facenet_celeb_ncs.graph"
MODEL_PATH = 'python/face_matcher/models/knn_model.clf'


def onboarding(train_dir, graph, model_save_path=None, n_neighbors=None, knn_algo='ball_tree', verbose=False,name='unknown'):
    """
    Trains a k-nearest neighbors classifier for face recognition.
    :param train_dir: directory that contains a sub-directory for each known person, with its name.
     (View in source code to see train_dir example tree structure)
     Structure:
        <train_dir>/
        ├── <person1>/
        │   ├── <somename1>.jpeg
        │   ├── <somename2>.jpeg
        │   ├── ...
        ├── <person2>/
        │   ├── <somename1>.jpeg
        │   └── <somename2>.jpeg
        └── ...
    :param model_save_path: (optional) path to save model on disk
    :param n_neighbors: (optional) number of neighbors to weigh in classification. Chosen automatically if not specified
    :param knn_algo: (optional) underlying data structure to support knn.default is ball_tree
    :param verbose: verbosity of training
    :return: returns knn classifier that was trained on the given data.
    """
    X = []
    y = []
    try:  
        os.makedirs("./face_embeddings/")
        print('embeddings folder created')
    except OSError:  
        pass
    # Loop through each person in the training set
    print('Creating embeddings')
    if len(os.listdir("./face_embeddings")) == 0:
        for class_dir in os.listdir(train_dir):
            if not os.path.isdir(os.path.join(train_dir, class_dir)):
                continue
            # Loop through each training image for the current person
            for img_path in image_files_in_folder(os.path.join(train_dir, class_dir)):
                
                image = face_recognition.load_image_file(img_path)
                face_bounding_boxes = face_recognition.face_locations(image)

                if len(face_bounding_boxes) != 1:
                    # If there are no people (or too many people) in a training image, skip the image.
                    if verbose:
                        print("Image {} not suitable for training: {}".format(img_path, "Didn't find a face" if len(face_bounding_boxes) < 1 else "Found more than one face"))
                else:
                    # Add face encoding for current image to the training set                 
                    #X.append(face_recognition.face_encodings(image, known_face_locations=face_bounding_boxes)[0])
                    face = extract_faces(image, face_bounding_boxes)[0]
                    resized_image = preprocess_image(face)
                    encoding = run_inference(resized_image, graph)
                    X.append(encoding)
                    y.append(class_dir)
                    print("x", X)
                    print("y", y)
        # Save the face embeddings and just load them next time so they don't have to be created every time
        np.save('./face_embeddings/encodings.npy',X,allow_pickle=False)
        np.save('./face_embeddings/class_dir.npy',y,allow_pickle=False)
    else:
        print('Loading embeddings')
        X_temp = np.load('./face_embeddings/encodings.npy',allow_pickle=False)
        y_temp = np.load('./face_embeddings/class_dir.npy',allow_pickle=False)
        for embedding in X_temp:
            X.append(embedding)
        for name in y_temp:
            y.append(name)

        if len(os.listdir("python/face_matcher/unknown_faces")) != 0:
            for class_dir in os.listdir("python/face_matcher/unknown_faces"):
                if not os.path.isdir(os.path.join("python/face_matcher/unknown_faces", class_dir)):
                    continue
                # Loop through each training image for the current person
                for img_path in image_files_in_folder(os.path.join("python/face_matcher/unknown_faces", class_dir)):
                    image = face_recognition.load_image_file(img_path)
                    face_bounding_boxes = face_recognition.face_locations(image)
                    if len(face_bounding_boxes) != 1:
                        # If there are no people (or too many people) in a training image, skip the image.
                        print('No person found or too many people in image')
                        if verbose:
                            print("Image {} not suitable for training: {}".format(img_path, "Didn't find a face" if len(face_bounding_boxes) < 1 else "Found more than one face"))
                    else:
                        # Add face encoding for current image to the training set                 
                        # X.append(face_recognition.face_encodings(image, known_face_locations=face_bounding_boxes)[0])
                        face = extract_faces(image, face_bounding_boxes)[0]
                        resized_image = preprocess_image(face)
                        encoding = run_inference(resized_image, graph)
                        X.append(encoding)
                        y.append(class_dir)
            np.save('./face_embeddings/encodings.npy',X)
            np.save('./face_embeddings/class_dir.npy',y)
            print('New encodings saved')
            print('y',y)
        
    # Determine how many neighbors to use for weighting in the KNN classifier
    if n_neighbors is None:
        n_neighbors = int(round(math.sqrt(len(X))))
        if verbose:
            print("Chose n_neighbors automatically:", n_neighbors)

    # Create and train the KNN classifier
    knn_clf = neighbors.KNeighborsClassifier(n_neighbors=n_neighbors, algorithm=knn_algo, weights='distance')
    knn_clf.fit(X, y)

    # Save the trained KNN classifier
    # Once the model is trained and saved, you can skip this step next time.
    if model_save_path is not None:
        with open(model_save_path, 'wb') as f:
            pickle.dump(knn_clf, f)
    print('Successfully trained knn')
    return knn_clf             




def initCamera():
    camera = picamera.PiCamera()
    camera.resolution = (320, 240)
    print("Camera ready!")
    return camera

# whiten an image
def whiten_image(source_image):
    source_mean = np.mean(source_image)
    source_standard_deviation = np.std(source_image)
    std_adjusted = np.maximum(
        source_standard_deviation, 1.0 / np.sqrt(source_image.size))
    whitened_image = np.multiply(np.subtract(
        source_image, source_mean), 1 / std_adjusted)
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


def extract_faces(vid_frame, face_locations):
    face_img_list = []
    for face_location in face_locations:

       # Print the location of each face in this image
      top, right, bottom, left = face_location
      print("A face is located at pixel location Top: {}, Left: {}, Bottom: {}, Right: {}".format(
          top, left, bottom, right))
      # You can access the actual face itself like this:
      face_image = vid_frame[top:bottom, left:right]
      face_img_list.append(face_image)
    return face_img_list


def add_face(camera, graph, new_name):
            now = datetime.now()
            local_time = now.strftime("%I-%M-%S_%Y-%d-%B")
            path = "python/face_matcher/unknown_faces/" + new_name + "/"
            try:
                os.mkdir(path)
            except OSError:
                print(OSError)
                print("Creation of the directory %s failed" % path)
            else:
                print("Successfully created the directory %s " % path)
            for i in range(3, 0, -1):
                print("Taking picture in: ", i)
                time.sleep(1)
            for i in range(3):
                now = datetime.now()
                local_time = now.strftime("%I-%M-%S_%Y-%d-%B")
                camera.capture("python/face_matcher/unknown_faces/" +
                               new_name + "/" + new_name + "_" + local_time + ".png")
                time.sleep(1)
                print("Picture successfully taken")
            if len(os.listdir("python/face_matcher/unknown_faces")):
                classifier = onboarding("python/face_matcher/unknown_faces", graph=graph, name=new_name, model_save_path=MODEL_PATH)
                move_files()


def move_files():
    print("Moving files")
    if len(os.listdir("python/face_matcher/unknown_faces")) == 0:
        print("Directory is empty")
        print('Model already exists')
    else:
        unknown = os.listdir("python/face_matcher/unknown_faces")
        destination = "python/face_matcher/known_faces"
        for f in unknown:
            shutil.move("python/face_matcher/unknown_faces" +
                        '/' + f, destination)
            # print(os.path.join(directory, filename))
        print('All files moved')

def main(name):
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

    add_face(camera, graph, name)

    # Clean up the graph and the device
    camera.close()
    graph.DeallocateGraph()
    device.CloseDevice()
