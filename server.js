var pass_phrase = "inputyourpasswordhere";

var validator= require('validator');

// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

//WebSocketサーバーの定義
io.set('transports', ['websocket', 'polling']); //websocketsに限定する場合に指定。c9.ioではコメントアウト
//io.set('match origin protocol', true);
//io.set("log level", 1);

server.listen(port, function () {
  console.log('Version: ' + process.version);
  console.log('Server listening at port %d', port);
});

process.on('exit', function(){
  server.close();
});
process.on('uncaughtException', function(){
  server.close();
});
process.on('SIGTERM', function(){
  server.close();
});

// Routing
app.use(express.static(__dirname + '/public'));

// パスフレーズのみの簡易認証のためのユーザリスト
var userList = {}; //{id : bool}

//bind message func to individual socket
io.sockets.on("connection", function(socket) {

    userList[socket.id] = false;
    console.log("user: ", Object.keys(userList).length);
    
  var disconnected = function () {
    
    // delete from userList
    delete userList[socket.id];
    
    console.log("user: ", Object.keys(userList).length);
  };
  
  // 接続が途切れたときのイベントリスナを定義
  socket.on("disconnect", disconnected);

  socket.on("password", function (pass){
    if(pass && pass == pass_phrase){
      socket.emit("password accepted", {id:socket.id});
      userList[socket.id] = true;
      return;
    }
    
    socket.emit("password denied");    
  });

  // クライアントからのメッセージ送信を受け取ったとき
  socket.on("send msg", function(msg) {
    if(socket.id in userList && msg)
    {
      socket.broadcast.emit("push msg", msg);
    }
  });
});

console.log('server started');