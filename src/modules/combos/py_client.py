import socketio

sio = socketio.Client()

@sio.event
def connect():
    print('server connection established')

@sio.event
def send_message(msg):
    print('message received with ', msg)
    sio.emit('send_message', msg)

@sio.event
def paint(paintObj):
    #print('message received with ', paintObj)
    sio.emit('paint', paintObj)

@sio.event
def disconnect():
    print('disconnected from server')

sio.connect('http://192.168.68.117:5050') #'http://192.168.68.117:5050') #https://tranquil-ridge-32141.herokuapp.com/')

#sio.wait()