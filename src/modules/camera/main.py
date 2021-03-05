#!/usr/bin/env python
# -*- coding: utf-8 -*-
from flask import Flask, request, render_template, Response
from flask_cors import CORS
from flask_socketio import SocketIO
from camera import VideoCamera as cam
import cv2
import imutils
import io
import base64
from PIL import Image
import numpy as np
#import eventlet

#eventlet.monkey_patch(thread=False)


#sio = socketio.Server()


app = Flask(__name__)
CORS(app)
sio = SocketIO(app, cors_allowed_origins="*")

@sio.on('image')
def image(data_image):
    sbuf = io.StringIO()
    sbuf.write(data_image)
    # decode and convert into image
    b = io.BytesIO(base64.b64decode(data_image))
    pimg = Image.open(b)

    ## converting RGB to BGR, as opencv standards
    frame = cv2.cvtColor(np.array(pimg), cv2.COLOR_RGB2BGR)
    imgencode = cam.get_frame(frame)
    # Process the image frame
    #frame = imutils.resize(frame, width=700)
    #frame = cv2.flip(frame, 1)
    #imgencode = cv2.imencode('.jpg', frame)[1]
    prevX = cam.get_prevX()
    prevY = cam.get_prevY()
    currX = cam.get_currX()
    currY = cam.get_currY()
    activeColor = "#000"
    if(currX==-1 or currY==-1):
        pos= { "x": "null", "y": "null" }
    else:
        #prevPos= { "x": "null", "y": "null" }
        pos= { "x": currX, "y": currY }
        #coords = { "prevPos": prevPos, "currPos": pos }
        #paintObj = { "color": activeColor, "coords": coords }
        #sio.emit('pos', paintObj)
        sio.emit('pos', pos)
            


if __name__ == "__main__":
    #app.run(debug=True)
    sio.run(app)