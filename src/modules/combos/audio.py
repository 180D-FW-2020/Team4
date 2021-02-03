#!/usr/bin/env python
# -*- coding: utf-8 -*-
from flask import Flask, request, render_template, Response
from flask_cors import CORS
from flask_socketio import SocketIO
from microphone_recognition import mr
from camera import VideoCamera as cam
import os
import py_client as pc
#import socketio
import cv2
import imutils
import io
import base64
from PIL import Image
import numpy as np

#sio = socketio.Server()


app = Flask(__name__)
CORS(app)
sio = SocketIO(app, cors_allowed_origins="*")

# @sio.on('image')
# def image(data_image):
#     sbuf = io.StringIO()
#     sbuf.write(data_image)
#     # decode and convert into image
#     b = io.BytesIO(base64.b64decode(data_image))
#     pimg = Image.open(b)

#     ## converting RGB to BGR, as opencv standards
#     frame = cv2.cvtColor(np.array(pimg), cv2.COLOR_RGB2BGR)
#     imgencode = cam.get_frame(frame)
#     # Process the image frame
#     #frame = imutils.resize(frame, width=700)
#     #frame = cv2.flip(frame, 1)
#     #imgencode = cv2.imencode('.jpg', frame)[1]
#     prevX = cam.get_prevX()
#     prevY = cam.get_prevY()
#     currX = cam.get_currX()
#     currY = cam.get_currY()
#     activeColor = "#000"
#     if(prevX==-1 or prevY==-1):
#         prevPos= { "x": "null", "y": "null" }
#     else:
#         prevPos= { "x": prevX, "y": prevY}
#     if(currX==-1 or currY==-1):
#         pos= { "x": "null", "y": "null" }
#     else:
#         pos= { "x": currX, "y": currY }
            
#     coords = { "prevPos": prevPos, "currPos": pos }
#     paintObj = { "color": activeColor, "coords": coords }
#     sio.emit('pos', paintObj)
#     ##########print (paintObj)
#     #pc.paint(paintObj)
#     # base64 encode
#     ###stringData = base64.b64encode(imgencode).decode('utf-8')
#     ###b64_src = 'data:image/jpg;base64,'
#     ###stringData = b64_src + stringData
#     #stringData = "hihihihi"
#     # emit the frame back
#     #sio.emit('response_back', stringData)

@app.route("/", methods=['POST', 'GET'])
def index():
    if request.method == "POST":
        f = request.files['audio_data']
        with open('audio.wav', 'wb') as audio:
            f.save(audio)
        print('file uploaded successfully')
        return render_template('index.html', request="POST")
    else:
        return render_template("index.html")

def gen(camera):
    while True:
        frame = camera.get_frame()
        prevX = camera.get_prevX()
        prevY = camera.get_prevY()
        currX = camera.get_currX()
        currY = camera.get_currY()
        activeColor = "#000"
        if(prevX==-1 or prevY==-1):
            prevPos= { "x": "null", "y": "null" }
        else:
            prevPos= { "x": prevX, "y": prevY}
        if(currX==-1 or currY==-1):
            pos= { "x": "null", "y": "null" }
        else:
            pos= { "x": currX, "y": currY }
            
        coords = { "prevPos": prevPos, "currPos": pos }
        paintObj = { "color": activeColor, "coords": coords }
        pc.paint(paintObj)

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n\r\n')


@app.route('/audio', methods=['POST', 'GET'])
def guess():
    if request.method == "POST":
        f = request.files['audio_data']
        with open('audio.wav', 'wb') as audio:
            f.save(audio)
        guess = mr()
        #sio.emit('send_message', guess)
        pc.send_message(guess)
        return "OK"
        #return render_template("index.html")
    else:
        return render_template("index.html")

@app.route('/video_feed')
def video_feed():
    return Response(gen(VideoCamera()),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == "__main__":
    app.run(debug=True, port=5051)
    #sio.run(app)