const axios = require("axios");
const cheerio = require("cheerio");
const ROUND = require("./round");

class ROOM {
  constructor(options) {
    this.id = options.id;
    this.name = options.name;
    this.isPrivate = options.isPrivate || false;
    this.password = options.password || "";
    this.maxPlayers = options.maxPlayers || 8;
    this.users = [...options.users] || [];
    this.queue = [...options.users] || [];
    this.roundTime = options.roundTime || 180;
    this.wordTime = options.wordTime || 25;
    this.maxRounds = options.maxRounds || 3;
    this.points =
      {
        ...options.points,
      } || {};
    this.painter = null;
    this.created = true;
    this.round = null;
    this.numRounds = 0;
  }

  async getWord() {
    var fs = require('fs');
    var data = fs.readFileSync('WordList.txt','utf8')
    data = data.split("\n");
    var high = data.length;
    var num = Math.floor(Math.random() * (high - 0) + 0);
    var word = data[num].trim();
    return word;
  }

  async initRound() {
    let words = [
      await this.getWord(),
      await this.getWord(),
      await this.getWord(),
    ];
    this.setPainter();
    io.to(this.painter).emit("round_initialized", words);

    let time = this.wordTime;
    io.to(this.id).emit("countdown_painter", time);
    let interval = setInterval(() => {
      if (this.users.length > 1) {
        if (time <= 0) {
          //CHAT.sendServerMessage(
            //this.id,
            //`Painter didn't choose a word, skipping round...`
          //);
          //this.initRound();
          var num = Math.floor(Math.random() * (2 - 0) + 0);
          this.startRound(words[num])
          clearInterval(interval);
        } else if (this.round != null) {
          clearInterval(interval);
        }
        time--;
        if (time >= 0) io.to(this.id).emit("countdown_painter", time);
      }
    }, 1000);
  }

  countDown(time) {
    io.to(this.id).emit("countdown", time);
    let interval = setInterval(() => {
      if (time <= 0) {
        CHAT.sendServerMessage(
          this.id,
          `No one guessed the word: ${this.round.word}`
        );
        this.stopRound();
        clearInterval(interval);
      } else if (this.round == null) {
        clearInterval(interval);
      } else {
        time--;
        io.to(this.id).emit("countdown", time);
      }
    }, 1000);
  }

  startRound(word) {
    if (this.users.length > 1) {
      this.round = new ROUND(word);
      io.to(this.id).emit("round_started");
      io.to(this.painter).emit("receive_password", word);
      CHAT.sendServerMessage(this.id, `Round started!`);
      CHAT.sendCallbackID(this.painter, `The chosen word is: ${word}`);
      this.countDown(this.roundTime);
    } else {
      CHAT.sendCallbackID(
        this.painter,
        `You need at least 2 players to start!`
      );
    }
  }

  stopRound() {
    this.round = null;
    this.clearBoard();
    io.to(this.id).emit("round_stopped");
    CHAT.sendServerMessage(this.id, `Round finished!`);
    io.to(this.id).emit("countdown", 0);
    this.numRounds++;
    // Restart
    if (this.numRounds < (this.maxRounds*this.users.length)) {
      this.initRound();
    } else {
      io.to(this.id).emit("game_ended");
    }
    //else do something
  }

  clearBoard() {
    if (this.round != null) {
      this.round.clearLines();
    }
    io.to(this.id).emit("clear");
  }

  setPainter() {
    if (this.users.length == 0) return false;

    let newPainter;
    do {
      newPainter = this.queue.pop();
      this.queue.unshift(newPainter);
    } while (this.painter == newPainter);
    this.painter = newPainter;

    io.to(this.id).emit("painter_changed", newPainter);
    CHAT.sendCallbackID(this.painter, "You are the new painter!");

    return true;
  }

  getPainter() {
    for (let user of this.users) {
      if (user == this.painter) {
        return user;
      }
    }
    return false;
  }

  addUser({ id }) {
    this.users.push(id);
    this.points[id] = 0;
    this.queue.unshift(id);
    this.updateUsers();
  }

  removeUser({ id, name }) {
    this.users.splice(this.users.indexOf(id), 1);
    this.queue.splice(this.queue.indexOf(id), 1);

    // If user who left was a painter, replace him.
    if (this.painter == id) {
      this.stopRound();
      CHAT.sendServerMessage(
        this.id,
        `${name} left the game, choosing another painter...`
      );
    }

    this.updateUsers();

    // Return if room is empty
    return this.users.length == 0 ? true : false;
  }

  givePoints({ id }, points = 1) {
    this.points[id] += points;
    this.updateUsers();
  }

  updateUsers() {
    io.to(this.id).emit("receive_users", this.getUsers());
  }

  getUsers() {
    let usrs = [];
    
    for (let user of this.users) {
      //console.log(io.sockets.sockets.get(user).name);
      //console.log(Array.from(io.sockets.sockets)[0]);
      //console.log(io.sockets.sockets)
      usrs.push({
        id: user,
        points: this.points[user] || 0,
        name: io.sockets.sockets.get(user).name || user,
      });
    }
    return usrs;
  }
}

module.exports = ROOM;
