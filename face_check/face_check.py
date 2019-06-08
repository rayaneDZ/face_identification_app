import os
import cv2
import numpy as np
from PIL import Image

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
path = os.path.join(BASE_DIR, 'check.jpeg')
face_cascade = cv2.CascadeClassifier('/home/pi/Desktop/face_identification_app/face_check/haarcascade_frontalface_default.xml')

image = Image.open(path)
gray = image.convert('L')
image_array = np.array(gray, 'uint8')
faces = face_cascade.detectMultiScale(image_array, 1.3, 5)
for (x, y, w, h) in faces:
    print('yes')
