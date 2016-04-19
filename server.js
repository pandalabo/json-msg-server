var pass_phrase = "inputyourpasswordhere";

// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

//WebSocket server definition
io.set('transports', ['websocket', 'polling']); //websockets only or 

server.listen(port, function () {
  console.log('Node Version: ' + process.version);
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

// authentication list
var userList = {}; //{id : bool}

//bind message func to individual socket
io.sockets.on("connection", function(socket) {

    userList[socket.id] = false;
    console.log("user: ", Object.keys(userList).length);
    
    //disconnection occurs anywhere
    var disconnected = function () {
    
    // delete from userList
    delete userList[socket.id];
    
    console.log("user: ", Object.keys(userList).length);
  };
  
  socket.on("disconnect", disconnected);

  // simple & insecure authentication
  socket.on("password", function (pass){
    if(pass && pass == pass_phrase){
      socket.emit("password accepted", {id:socket.id});
      userList[socket.id] = true;
      return;
    }
    
    socket.emit("password denied");    
  });

  // only authenticated user may send message
  socket.on("send msg", function(msg) {
    if(socket.id in userList && msg){
      socket.broadcast.emit("push msg", msg);
    }
  });
});

console.log('server started');