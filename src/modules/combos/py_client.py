import socketio

sio = socketio.Client()

@sio.event
def connect():
    print('connection established')

@sio.event
def send_message(data):
    print('message received with ', data)
    sio.emit('send_message', data)

@sio.event
def disconnect():
    print('disconnected from server')

sio.connect('http://192.168.68.117:5050') #https://tranquil-ridge-32141.herokuapp.com/')

#sio.wait()