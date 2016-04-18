/* Goita Client Class
   handles WebSocket messages */
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
  this.connected = fnEmpty; //function()
  this.connectFailed = fnEmpty;//function()
  this.disconnected = fnEmpty; //function()
  this.loginSuccess = fnEmpty;
  this.loginFailed = fnEmpty;
  this.messageRecieved = fnEmpty; //function(msg [, header[, type]])

};

//class method
MsgClient.prototype = {
  
  //connect to server
  connect : function(){
    //already isConnected
    if(this.isConnected) return this.socket;

    var self = this;  //capture a client instance

    var socket;
    if(this.serverURI != null)
      io.connect(this.serverURI);
    else
      socket = io.connect();
    this.socket = socket;
    
    //socketが無事取得できていればこの時点で接続確立しているはず。
    if(socket != undefined && socket != null){
      console.log("got socket-client successfully");
    }
    else{
      this.isConnected = false;
      this.connectFailed();
    }

    //for reconnecting, no need to define events again
    if(this._eventDefined) return socket;

    //------------define events ------------------
    
    // 接続できたというメッセージを受け取ったら
    socket.on("connect", function() {
      self.isConnected = true;
      console.log("client connected!");
      self.connected();
    });
    
    //切断した場合
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

    // ロビーに入ったというメッセージを受け取ったら
    socket.on("password accepted", function(data){
      console.log("password accepted");
      socket.id = data.id; //特に使う場面がないが一応
      self.userId = data.id;
      self.isAuthorized = true;
      self.loginSuccess();
    });

    //ロビーに入れなかった場合
    socket.on("password denied", function(){
      console.log("failed to log in");
      self.loginFailed(error);
    });



    //ロビーメッセージを受け取ったら msg={text: message text, username: user name}
    socket.on("push msg", function(msg) {
      self.messageRecieved(msg);
    });

    //to avoid overloading event
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
  var callerName = fnEmpty.caller != null ? fnEmpty.caller.name : "root";
  //console.log("unhandled event raised, caller name:" + callerName); 
};