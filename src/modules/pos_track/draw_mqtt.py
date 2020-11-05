#References

#https://docs.opencv.org/3.0-beta/doc/py_tutorials/py_gui/py_video_display/py_video_display.html
#https://opencv-python-tutroals.readthedocs.io/en/latest/py_tutorials/py_imgproc/py_colorspaces/py_colorspaces.html#converting-colorspaces
#https://opencv-python-tutroals.readthedocs.io/en/latest/py_tutorials/py_imgproc/py_thresholding/py_thresholding.html#thresholding
#https://opencv-python-tutroals.readthedocs.io/en/latest/py_tutorials/py_imgproc/py_contours/py_contour_features/py_contour_features.html#contour-features

from collections import deque
from imutils.video import VideoStream
from paho.mqtt import client as mqtt_client

import json
import random
import cv2
import numpy as np
import argparse
import imutils
import time



################################# Motion Tracking Start #########################################
ap = argparse.ArgumentParser()
ap.add_argument("-v","--video",help="path to the (optional) video file")
ap.add_argument("-b","--buffer",type=int, default=64,help="max buffer size")
args = vars(ap.parse_args())

#We want to track the color pink
pinkLower = (94,113,175)
pinkUpper = (179,255,255)

#holds the drawing (64 points)
pts = deque(maxlen=args['buffer'])  

#Start camera
if not args.get("video",False):
    cap = VideoStream(src=0).start()
else:
    cap = cv2.VideoCapture(args["video"])

#Allows camera to warm up
time.sleep(2.0)

#Globals (User can change)
thickness_amt = 5
color = (0,0,255)

############################################ MQTT ###############################################
broker = 'broker.hivemq.com'
port = 1883
topic = "/python/mqtt/snakes"
client_id = f'python-mqtt-{random.randint(0, 1000)}'

def connect_mqtt():
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print("Connected to MQTT Broker!")
        else:
            print("Failed to connect, return code %d\n", rc)
    # Set Connecting Client ID
    client = mqtt_client.Client(client_id)
    client.on_connect = on_connect
    client.connect(broker, port)
    return client

client = connect_mqtt()
#################################################################################################


while(1):

    # Take each frame
    frame = cap.read()

    #Make the video be a mirror image
    frame = cv2.flip(frame,1)

    frame = frame[1] if args.get("video",False) else frame

    if frame is None:
        break

    #Resize the frame
    frame = imutils.resize(frame,width=600)
    
    #Gaussian Blur to smoothe the image
    blurred = cv2.GaussianBlur(frame,(11,11),0)    
    
    # Convert BGR to HSV
    hsv = cv2.cvtColor(blurred, cv2.COLOR_BGR2HSV)

    # Threshold the HSV image to get only green colors
    mask = cv2.inRange(hsv, pinkLower, pinkUpper)

    #Erode away the boundaries (removes white noise and shrinks area)
    mask = cv2.erode(mask, None, iterations=2)

    #Increase our area back but now without white noise => more accurate
    mask = cv2.dilate(mask, None, iterations=2)
    
    #Find contours and the center
    cnts = cv2.findContours(mask.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cnts = imutils.grab_contours(cnts)
    center = None

    if len(cnts) > 0:
        c = max(cnts, key=cv2.contourArea)
        ((x,y), radius) = cv2.minEnclosingCircle(c)
        M = cv2.moments(c)
        center = (int(M["m10"] / M["m00"]), int(M["m01"] / M["m00"]))

    #Add the point to the pts list => create drawing
    pts.appendleft(center)

    dataOut = json.dumps(str(pts))
    client.publish(topic,dataOut)

    #connect the points with a line
    for i in range(1,len(pts)):
        if pts[i-1] is None or pts[i] is None:
            continue
        #user can control the thickness with the global thickness_amt
        thickness = int(np.sqrt(args["buffer"] / float(i+1))*thickness_amt)
        #draw a line
        cv2.line(frame, pts[i-1], pts[i], color, thickness)
    
    #display
    cv2.imshow("frame",frame)
    cv2.imshow("mask",mask)
    key = cv2.waitKey(1) & 0xFF
    if key == ord("q"):
        break


cap.release()
cv2.destroyAllWindows()