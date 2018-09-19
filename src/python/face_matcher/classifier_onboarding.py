import math
from sklearn import neighbors
import numpy
import os
import sys
import os.path
import pickle
import face_recognition
from face_recognition.face_recognition_cli import image_files_in_folder

class Unbuffered(object):
   def __init__(self, stream):
       self.stream = stream
   def write(self, data):
       self.stream.write(data)
       self.stream.flush()
   def writelines(self, datas):
       self.stream.writelines(datas)
       self.stream.flush()
   def __getattr__(self, attr):
       return getattr(self.stream, attr)
sys.stdout = Unbuffered(sys.stdout)

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
                    encoding = run_inference(face, graph)
                    X.append(encoding)
                    y.append(class_dir)
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

        if len(os.listdir("./unknown_faces")) != 0:
            for class_dir in os.listdir("./unknown_faces"):
                if not os.path.isdir(os.path.join("./unknown_faces", class_dir)):
                    continue
                # Loop through each training image for the current person
                for img_path in image_files_in_folder(os.path.join("./unknown_faces", class_dir)):
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
                        encoding = run_inference(face, graph)
                        X.append(encoding)
                        y.append(class_dir)
            np.save('./face_embeddings/encodings.npy',X)
            np.save('./face_embeddings/class_dir.npy',y)
            print('New encodings saved')
            print('x',X)
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