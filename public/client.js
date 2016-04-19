/* Client Class handles WebSocket messages */
var MsgClient = function(){
  //private field
  this._eventDefined = false;

  //member field
  this.socket = null;  //socket.io
  this.serverURI = null;
  this.isConnected = false;
  this.isAuthorized = false;

  this.userId = null;

  //event - inject event handler
  this.connected = fnEmpty;
  this.connectFailed = fnEmpty;
  this.disconnected = fnEmpty;
  this.loginSuccess = fnEmpty;
  this.loginFailed = fnEmpty;
  this.messageRecieved = fnEmpty;

};

//class method
MsgClient.prototype = {
  
  //connect to server
  connect : function(){
    //already connected
    if(this.isConnected) return this.socket;

    var self = this;  //capture a client instance

    var socket;
    if(this.serverURI)
      socket = io.connect(this.serverURI);
    else
      socket = io.connect();
    this.socket = socket;
    
    //ensure socket.io connetion established
    if(!socket){
      console.log("got socket-client successfully");
    }
    else{
      this.isConnected = false;
      this.connectFailed();
    }

    //
    if(this._eventDefined) return socket;

    //------------define events ------------------
    socket.on("connect", function() {
      self.isConnected = true;
      console.log("client connected!");
      self.connected();
    });
    
    socket.on('disconnect', function(){
      self.isConnected = false;
      self.userId = null;
      self.isAuthorized = false;
      console.log("client disconnected");
      self.disconnected();
    });

    //unhandled error
    socket.on("error", function(error){
      console.log("happened error: " + error);
    });

    //authentication success
    socket.on("password accepted", function(data){
      console.log("password accepted");
      socket.id = data.id; //特に使う場面がないが一応
      self.userId = data.id;
      self.isAuthorized = true;
      self.loginSuccess();
    });

    //authentication failed
    socket.on("password denied", function(){
      console.log("failed to log in");
      self.loginFailed(error);
    });



    //broadcast message
    socket.on("push msg", function(msg) {
      self.messageRecieved(msg);
    });

    //avoid overloading event
    this._eventDefined = true;
    return socket;
  },

  //close connection
  disconnect : function(){
    this.socket.close();
    console.log("client disconnected...");
  },

  login : function(pass){
    this.socket.emit("password", pass);
  },

  send : function(json){
    this.socket.emit("send msg", json);
  }
};

//empty method
var fnEmpty = function(){
};