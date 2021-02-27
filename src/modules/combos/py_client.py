import socketio

siow = socketio.Client()

@siow.event
def connection():
    print('server connection established')

@siow.event
def send_message(msg):
    print('message received with ', msg)
    siow.emit('send_message', msg)

@siow.event
def paint(paintObj):
    #print('message received with ', paintObj)
    siow.emit('paint', paintObj)

@siow.event
def disconnect():
    print('disconnected from server')

siow.connect('http://192.168.1.252:5050') #'http://192.168.68.117:5050') #https://tranquil-ridge-32141.herokuapp.com/')

#sio.wait()