const axios = require("axios");
const cheerio = require("cheerio");
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require("constants");
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
    //5 bit number (0 to 31) that stores the information of the power ups based on the id of the user
    this.powerUps = 
      {
        ...options.powerUps,
      } || {};
    //keeps track of the amount of times in a row that everyone guesses their drawing (uses id)
    this.artist_AllCorrectStreak = 
      {
        ...options.AllCorrectStreak,
      } || {};
    this.painter = null;
    this.created = true;
    this.round = null;
    this.numRounds = 0;
    this.TimeLeft = 0;
    this.numCorrect = 0;
    this.topPoints = 0;
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
        this.TimeLeft = time;
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
    
    //If everyone guessed correctly
    if(this.numCorrect == this.users.length - 1){
      this.artist_AllCorrectStreak[this.painter] += 1;
      //if the streak is 1
      if(this.artist_AllCorrectStreak[this.painter] == 1){
        //check if they already have this power up
        var valid = Math.floor(this.powerUps[this.painter]/16);
        if(valid == 0){
          //if they don't, assign the fifth bit by adding 16 (2^4 = 16)
          this.powerUps[this.painter] += 16;
        }
      }
      //if they get 3 in a row:
      else if(this.artist_AllCorrectStreak[this.painter] == 3)
      {
        //check if they have it already
        
        //to get fourth bit value, mod by 16 to remove the 16
        var temp = this.powerUps[this.painter]%16;
        //divide by 8 and round down (8 or larger -> 1, 7 or smaller -> 0)
        var valid = Math.floor(temp/8);
        if(valid == 0){
          //assign it if they don't have it
          this.powerUps[this.painter] += 8;
        }
      }
    }
    else{
      //if they do not all guess correctly, the streak is over, so assign it 0
      this.artist_AllCorrectStreak[this.painter] = 0;
    }

    //Artist Points

    //artist gets half the points of first place plus an incentive for the more people guess
    var artist_points = parseInt(this.topPoints/2) + parseInt((this.numCorrect/(this.users.length-1)) * (this.topPoints/4));
    this.points[this.painter] += artist_points;
    this.updateUsers();

    //If we are in the last round
    if(this.numRounds >= (this.users.length*(this.maxRounds-1))){

      //check if they have the double points power up
      var temp = this.powerUps[this.painter]%16;
      var valid = Math.floor(temp/8);
      //if they do, double the points from this round
      if(valid == 1)
      {
        this.points[this.painter] += artist_points;
        this.updateUsers();
      }
    }

    this.clearBoard();
    io.to(this.id).emit("round_stopped");
    CHAT.sendServerMessage(this.id, `Round finished!`);
    io.to(this.id).emit("countdown", 0);
    this.numRounds++;
    this.numCorrect = 0;
    this.topPoints = 0;
    
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
    this.powerUps[id] = 0;
    this.artist_AllCorrectStreak[id] = 0;
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

  givePoints({ id }, points = 500) {
    //if this is the first person to guess
    if(this.numCorrect == 0){
      //store the points that go to first guesser in order to assign to artist at the end
      this.topPoints = parseInt(points*(this.TimeLeft/this.roundTime));
    }
    //update score of guesser
    this.points[id] += parseInt(points*(this.TimeLeft/this.roundTime));
    this.numCorrect++;
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
  usePowerUp_1({ id }){
    var valid = Math.floor(powerUps[id]/16);
    if(valid == 1)
    {
      powerUps[id] -= 16;
      time += 20;
      this.TimeLeft = time;
      io.to(this.id).emit("countdown", time);
    }
  }
}

module.exports = ROOM;
