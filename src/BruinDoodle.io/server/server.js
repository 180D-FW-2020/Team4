const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http, { 
  cors: {
    origin: '*'
  }
});
const ROOMS = require("./rooms");
const CHAT = require("./chat");

global.io = io;
global.CHAT = CHAT;

var clients = [];
var num_guessed = 0;

io.on("connection", socket => {
  // Connect
  console.log(`User connected: ${socket.id}`);
  console.log(JSON.stringify(socket.handshake.headers.origin));
  socket.name = socket.id;
  clients.push(socket);

  // Disconnect
  socket.on("disconnect", () => {
    ROOMS.leaveRoom(socket);
    console.log(`User disconnected: ${socket.id}`);
    clients.splice(clients.indexOf(socket), 1);
  });

  // Set socket's name
  socket.on("setName", name => {
    socket.name = name;
    let room = ROOMS.getSocketRoom(socket);
    if (room)
      io.to(room.id).emit('receive_users', room.getUsers());
  });

  // Creating the room
  socket.on("create_room", options => {
    ROOMS.createRoom(socket, options);
  });

  // Get Room
  socket.on("get_room", id => {
    socket.emit("receive_room", ROOMS.getRoom(id));
  });

  // Joining Room
  socket.on("join_room", data => {
    if (ROOMS.joinRoom(socket, data.id, data.password)) {
      CHAT.sendServerMessage(data.id, `${socket.name} has joined the game!`);
      let room = ROOMS.getRoom(data.id);
      if (room.round != null) {
        socket.emit('getPainting', ROOMS.getRoom(data.id).round.lineHistory);
      }
    }
  });

  // Leaving Room
  socket.on("leave_room", () => {
    ROOMS.leaveRoom(socket);
  });

  // Getting Rooms
  socket.on("get_rooms", () => {
    socket.emit("receive_rooms", ROOMS.getRooms());
  });

  socket.on("send_message", msg => {
    other = socket;
    console.log(msg)
    //console.log('test1');
    //console.log(socket.handshake);
    if (typeof(socket.handshake.headers.origin)=='undefined'){
      console.log('test2');
      clients.forEach(function (cl) {
        console.log(socket.handshake.address);
        if (socket.handshake.address==cl.handshake.address){
          console.log(socket.handshake.address);
          if (cl.handshake.headers.origin == 'http://localhost:8080'){
            other = cl;
          }
        }
    });
    }
    let room = ROOMS.getSocketRoom(other);
    if (room) {

      if (room.round != null && other.id != room.painter) {
        // Checking if the message is correct
        if (room.round.check(msg)) {
          ROOMS.givePoints(other);
          CHAT.sendCallback(other, {
            self: `Congratulations! You've guessed the word!`,
            broadcast: `${other.name} guessed the word`
          });
          num_guessed++;
          if(num_guessed == (room.getUsers().length - 1))
          {
            num_guessed = 0;
            room.stopRound();
          }
        } else {
          CHAT.sendMessage(room.id, {
            msg,
            sender: other.name
          });
          if (room.round.isClose(msg)) {
            CHAT.sendCallback(other, {
              self: `You're so close!`
            });
          }
        }
      }
    }
  });

  socket.on("paint", (coords) => {
    //console.log('paint');
    other = socket;
    if (socket.handshake.headers.origin=='http://localhost:8080'){ //(typeof(socket.handshake.headers.origin)=='undefined'){
      //console.log("sssssssssssssssssssssssss")
      clients.forEach(function (cl) {
        //console.log(cl.name);
        if (cl.name!='Laptop1'){
          //console.log(typeof JSON.stringify(cl.handshake.headers.origin) == 'string');
          //if (String(cl.handshake.headers.origin) == "https://mighty-headland-55869.herokuapp.com/"){ //'http://192.168.68.117:8081'){
            //other = cl;
            //console.log("double yay")
          //}
          //console.log(cl.handshake.headers.origin)
          if (cl.handshake.headers.origin == 'http://localhost:8080'){//(typeof JSON.stringify(cl.handshake.headers.origin) == 'string'){ //'http://192.168.68.117:8081'){
            other = cl;
            //console.log("double yay")
          }
        }
        //console.log("boop");
        //console.log(cl.handshake.address);
        //if (socket.handshake.address==cl.handshake.address){
          //console.log(cl.handshake.headers);
          //if (cl.handshake.headers.origin == 'http://192.168.68.117:8081'){
          //console.log("test");  
          //other = cl;
          //}
        //}
    });
    }
    let room = ROOMS.getSocketRoom(other);
    if (room.painter == other.id && room.round != null) {
      socket.to(room.id).emit('paint', coords);
      room.round.addLine(coords);
    }

    //let room = ROOMS.getSocketRoom(socket);
    //if (room.painter == socket.id && room.round != null) {
      //socket.to(room.id).emit('paint', coords);
      //room.round.addLine(coords);
    //}
  });

  socket.on("clear", () => {
    let room = ROOMS.getSocketRoom(socket);
    if (room.painter == socket.id && room.round != null) {
      room.clearBoard();
    }
  });

  socket.on("word_chosen", word => {
    let room = ROOMS.getSocketRoom(socket);
    if (room.painter == socket.id && room.round == null) {
      room.startRound(word);
    }
  });

  socket.on("gesture_detected", gesture => {
    other = console;
    clients.forEach(function (cl){
      if(socket.name == (cl.name+"8")) {
        other = cl;
      }
    });

    let room = ROOMS.getSocketRoom(other);
    if(room.round != null) {
      switch(gesture) {
        case "Upward_Lift":
          if(room.painter == other.id) {
            room.useArtistPowerUp_1(other.id);
            console.log("Upward Lift Artist");
          }
          else {
            room.useGuesserPowerUp_1(other.id);
            console.log("Upward Lift Guesser");
          }

          break
        case "Clockwise_Twist":
          if(room.painter == other.id && room.round != null) {
            room.useArtistPowerUp_2(other.id);
            console.log("Clockwise Twist Artist");
          }
          else {
            room.useGuesserPowerUp_2(other.id);
            console.log("Clockwise Twist Guesser");
          }
          break
        case "Vertical_Chop":
          if(room.painter == other.id && room.round != null) {
            console.log("Vertical Chop Artist");
          }
          else {
            room.useGuesserPowerUp_3(other.id);
            console.log("Vertical Chop Guesser");
          }
          break
        default:
          console.log("Invalid Gesture");
      }
    }
    else {
      console.log("Game has not started yet...");
    }
  });
});

let port = process.env.PORT || 5050;

http.listen(port, () => {
  console.log(`Server is listening on port: ${port}`);
});

process.on("exit", function (code) {
  http.close();
  console.log("Server exit", code);
});