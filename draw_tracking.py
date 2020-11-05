#References

#https://docs.opencv.org/3.0-beta/doc/py_tutorials/py_gui/py_video_display/py_video_display.html
#https://opencv-python-tutroals.readthedocs.io/en/latest/py_tutorials/py_imgproc/py_colorspaces/py_colorspaces.html#converting-colorspaces
#https://opencv-python-tutroals.readthedocs.io/en/latest/py_tutorials/py_imgproc/py_thresholding/py_thresholding.html#thresholding
#https://opencv-python-tutroals.readthedocs.io/en/latest/py_tutorials/py_imgproc/py_contours/py_contour_features/py_contour_features.html#contour-features

from collections import deque
from imutils.video import VideoStream
import cv2
import numpy as np
import argparse
import imutils
import time

ap = argparse.ArgumentParser()
ap.add_argument("-v","--video",help="path to the (optional) video file")
ap.add_argument("-b","--buffer",type=int, default=64,help="max buffer size")
args = vars(ap.parse_args())

greenLower = (29,86,6)
greenUpper = (64,255,255)
pts = deque(maxlen=args['buffer'])

if not args.get("video",False):
    cap = VideoStream(src=0).start()
else:
    cap = cv2.VideoCapture(args["video"])

time.sleep(2.0)

#Globals
thickness_amt = 5
height = int(cv2.get(cv2.CAP_PROP_FRAME_HEIGHT))
width = int(cv2.get(cv2.CAP_PROP_FRAME_WIDTH))
print(height)
print(width)

while(1):

    # Take each frame
    frame = cap.read()

    frame = cv2.flip(frame,1)

    frame = frame[1] if args.get("video",False) else frame

    if frame is None:
        break

    frame = imutils.resize(frame,width=600)
    blurred = cv2.GaussianBlur(frame,(11,11),0)    
    
    # Convert BGR to HSV
    hsv = cv2.cvtColor(blurred, cv2.COLOR_BGR2HSV)

    # Threshold the HSV image to get only green colors
    mask = cv2.inRange(hsv, greenLower, greenUpper)
    mask = cv2.erode(mask, None, iterations=2)
    mask = cv2.dilate(mask, None, iterations=2)
    
    cnts = cv2.findContours(mask.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cnts = imutils.grab_contours(cnts)
    center = None

    if len(cnts) > 0:
        c = max(cnts, key=cv2.contourArea)
        ((x,y), radius) = cv2.minEnclosingCircle(c)
        M = cv2.moments(c)
        center = (int(M["m10"] / M["m00"]), int(M["m01"] / M["m00"]))

    pts.appendleft(center)

    for i in range(1,len(pts)):
        if pts[i-1] is None or pts[i] is None:
            continue
        thickness = int(np.sqrt(args["buffer"] / float(i+1))*thickness_amt)
        cv2.line(frame, pts[i-1], pts[i], (255,0,0), thickness)
    
    cv2.imshow("frame",frame)
    key = cv2.waitKey(1) & 0xFF
    if key == ord("q"):
        break


cap.release()
cv2.destroyAllWindows()