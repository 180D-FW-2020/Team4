#!/usr/bin/env python
# -*- coding: utf-8 -*-
from flask import Flask, request, render_template, Response
from paho.mqtt import client as mqtt_client
from microphone_recognition import mr
from camera import VideoCamera
import os
import random
import threading
#import py_client as pc

app = Flask(__name__)

broker = 'broker.hivemq.com'
port = 1883
topic = "/python/mqtt"
# generate client ID with pub prefix randomly
client_id = f'python-mqtt-{random.randint(0, 100)}'

def connect_mqtt() -> mqtt_client:
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print("Connected to MQTT Broker!")
        else:
            print("Failed to connect, return code %d\n", rc)

    client = mqtt_client.Client(client_id)
    client.on_connect = on_connect
    client.connect(broker, port)
    return client

def subscribe(client: mqtt_client):
    def on_message(client, userdata, msg):
        print(f"Received `{msg.payload.decode()}` from `{msg.topic}` topic")

    client.subscribe(topic)
    client.on_message = on_message

def run():
    client = connect_mqtt()
    subscribe(client)
    client.loop_forever()

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
            prevPos= { "x": 'null', "y": 'null' }
        else:
            prevPos= { "x": prevX, "y": prevY}
        if(currX==-1 or currY==-1):
            pos= { "x": 'null', "y": 'null' }
        else:
            pos= { "x": currX, "y": currY }

        coords = { "prevPos": prevPos, "currPos": pos }
        paintObj = { "color": activeColor, "coords": coords }
        #pc.paint(paintObj)

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n\r\n')


@app.route('/audio', methods=['POST', 'GET'])
def guess():
    if request.method == "POST":
        f = request.files['audio_data']
        with open('audio.wav', 'wb') as audio:
            f.save(audio)
        guess = mr()
        #pc.send_message(guess)
        return render_template("index.html")
    else:
        return render_template("index.html")

@app.route('/video_feed')
def video_feed():
    return Response(gen(VideoCamera()),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == "__main__":
  clientloop_thread = threading.Thread(target=run, daemon=True)
  clientloop_thread.start()
  app.run(debug=True)