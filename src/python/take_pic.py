import numpy as np
import picamera
from PIL import Image

def initCamera():
    camera = picamera.PiCamera()
    camera.resolution = (320, 240)
    print("Camera ready!")
    return camera

def main():
    camera = initCamera()
    pic = np.empty((240, 320, 3), dtype=np.uint8)
    print("Capturing image.")
    # Grab a single frame of video from the RPi camera as a np array
    camera.capture(pic, format="rgb")
    #Save pic to a temporary location
    im = Image.fromarray(pic)
    im.save("../../tmp/picture.png")

if __name__ = 'main':
    main()

