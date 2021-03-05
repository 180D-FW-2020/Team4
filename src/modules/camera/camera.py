
from collections import deque
from imutils.video import VideoStream
import cv2
import numpy as np
import argparse
import imutils
import time
#import simplejpeg

ap = argparse.ArgumentParser()
#ap.add_argument("-v","--video",help="path to the (optional) video file")
ap.add_argument("-b","--buffer",type=int, default=128,help="max buffer size")
t, unknown = ap.parse_known_args()
args = vars(t)#ap.parse_args())
pts = deque(maxlen=args['buffer']) 
pts.appendleft(None)
pts.appendleft(None)
#We want to track the color pink
pinkLower = (94,113,175) #(10,100,200)# (94,113,175)
pinkUpper = (179,255,255)#(35,160,255)#(179,255,255)

#Globals (User can change)
thickness_amt = 5
color = (0,0,255)

prev_x = 0
prev_y = 0

curr_x = 0
curr_y = 0

time.sleep(2.0)

class VideoCamera(object):
    def __init__(self):
        self.video = VideoStream(src=0).start()
    def get_prevX():#get_prevX(self):
        if(pts[1] is not None):
            return pts[1][0]
        else:
            return -1
    def get_currX():#get_currX(self):
        if(pts[0] is not None):
            return pts[0][0]
        else:
            return -1
    def get_prevY():#get_prevY(self):
        if(pts[1] is not None):
            return pts[1][1]
        else:
            return -1
    def get_currY():#get_currY(self):
        if(pts[0] is not None):
            return pts[0][1]
        else:
            return -1
    def get_frame(frame):#get_frame(self):
        #frame = self.video.read()
        frame = cv2.flip(frame,1)
        #frame = frame[1] if args.get("video",False) else frame
        scale_percent = 250
        width = int(frame.shape[1] * scale_percent/100)
        length = int(frame.shape[0] * scale_percent/100)
        dimension = (width, length)
        
        frame = cv2.resize(frame, dimension, interpolation = cv2.INTER_AREA)
        
        #Gaussian Blur to smoothe the image
        blurred = cv2.GaussianBlur(frame,(25,25),0)    
        
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
        return "OK"
