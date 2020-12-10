#!/usr/bin/env python
# -*- coding: utf-8 -*-
from flask import Flask, request, render_template, Response
from flask_mqtt import Mqtt
from microphone_recognition import mr
from camera import VideoCamera
import os
import py_client as pc


app = Flask(__name__)

app.config['MQTT_BROKER_URL'] = 'broker.hivemq.com'  # use the free broker from HIVEMQ
app.config['MQTT_BROKER_PORT'] = 1883  # default port for non-tls connection
app.config['MQTT_USERNAME'] = ''  # set the username here if you need authentication for the broker
app.config['MQTT_PASSWORD'] = ''  # set the password here if the broker demands authentication
app.config['MQTT_KEEPALIVE'] = 5  # set the time interval for sending a ping to the broker to 5 seconds
app.config['MQTT_TLS_ENABLED'] = False  # set TLS to disabled for testing purposes

mqtt = Mqtt()

received = []

@mqtt.on_connect()
def handle_connect(client, userdata, flags, rc):
    mqtt.subscribe('/python/mqtt')

@mqtt.on_message()
def handle_mqtt_message(client, userdata, message):
    data = dict(
        topic=message.topic,
        payload=message.payload.decode()
    )
    print(data)

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
            prevPos= { "x": null, "y": null }
        else:
            prevPos= { "x": prevX, "y": prevY}
        if(currX==-1 or currY==-1):
            pos= { "x": null, "y": null }
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
        pc.send_message(guess)
        return render_template("index.html")
    else:
        return render_template("index.html")

@app.route('/video_feed')
def video_feed():
    return Response(gen(VideoCamera()),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == "__main__":
    client = mqtt.Client()
    client.loop_start()

    app.run(debug=True)