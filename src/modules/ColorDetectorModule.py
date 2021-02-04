#References

#https://code.likeagirl.io/finding-dominant-colour-on-an-image-b4e075f98097
#https://github.com/opencv/opencv/blob/master/samples/python/kmeans.py

import numpy as np 
import cv2
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans


cap = cv2.VideoCapture(0)

def find_histogram(clt):
    numLabels = np.arange(0, len(np.unique(clt.labels_)) + 1)
    (hist,_) = np.histogram(clt.labels_, bins=numLabels)

    hist = hist.astype("float")
    hist /= hist.sum()

    return hist

def find_color(hist, centroids):
    bar = np.zeros((50, 300, 3), dtype="uint8")
    
    startX = 0              #keeps track of current color start
    startX_final = 0        #keeps track of start of dominant color (within the 300 length bar)
    endX_final = 0          #keeps track of end of dominant color  "                           "

    length = 0              #keeps track of dominant color length

    count = 0               #index counter
    index = 0               #index of dominant color within centroids

    for (percent, color) in zip(hist, centroids):
        # plot the relative percentage of each cluster
        endX = startX + (percent * 300) #calculate the end of the current color

        if endX - startX > length:  #calculate current length, compare to dominant length
            startX_final = startX   #if longer, update the dominant color parameters
            endX_final = endX
            length = endX-startX
            index = count

        startX = endX
        count = count + 1

    #make the bar the color of the max
    cv2.rectangle(bar, (int(0), 0), (int(300), 50), centroids[index].astype("uint8").tolist(), -1)
    bar = cv2.cvtColor(bar, cv2.COLOR_RGB2HSV)
    color = bar[0][0]
    return color

while(cap.isOpened()):

    #Capture frame-by-frame
    ret, frame = cap.read()
    #Mirror image
    frame = cv2.flip(frame,1)

    if not ret:
        break
    
    #create a box so that 
    x,y,w,h = 300,300,50,50                                     #coordinates for 300x300 box
    frame = cv2.rectangle(frame,(x,y),(x+w,y+h),(355,0,0),2)    #make a square using coordinates
    roi = frame[x:x+w,y:y+h].copy()                             #get the color data from the box

    res = cv2.cvtColor(roi, cv2.COLOR_BGR2RGB)                  
    res = res.reshape((res.shape[0] * res.shape[1],3))          #go from 3D to 2D

    key = cv2.waitKey(1) & 0xFF
    if key == ord('s'):
        clt = KMeans(n_clusters = 3)                                #k = 5 clusters
        clt.fit(res)                                                #fit the data into 5 clusters
        hist = find_histogram(clt)                                  #create a histogram of best colors
        color = find_color(hist, clt.cluster_centers_)              #get a bar with dominant color
        print(color)
        key = cv2.waitKey(1) & 0xFF
    elif key == ord('q'):
        break
    
    cv2.imshow('frame',frame)
       
#When everything done, release the capture
cap.release()
cv2.destroyAllWindows()
