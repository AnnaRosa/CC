var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var fs= require('fs');
var index = (fs.readFileSync(__dirname+ '/index.html')).toString();

app.get('/', function(req, res){
  res.sendFile(__dirname + '/login.html');
});
var users = [];
io.on('connection', function(socket){

	console.log('new User came online');



	socket.on('registration', function(chosenname){
        var accepted=true;
        for(var i= 0; i<users.length; i++){
          if(users[i].name===chosenname){
            accepted=false;
          }
        }

			if(accepted==true ){
				users.push({'id': socket.id, 'name': chosenname});
        socket.emit('registration success',index);
        io.emit('user update', chosenname + ' entered the chat');
			}
      else{
        socket.emit('registration fail', 'Registration failed: Name already in use! Please try again using another name!');
      }
	});

  socket.on('chat message', function(msg){
    var messageObject= JSON.parse(msg);
    var date=  new Date();
    var hours= date.getHours();
    if(hours <10){
      hours  = '0'+ hours;
    }
    var minutes = date.getMinutes();
    if(minutes <10){
      minutes= '0' + minutes;
    }
    var day= date.getDate();
    if(day <10){
      day= '0'+day;
    }
    var month= date.getMonth()+1;
    if(month <10){
      month= '0'+month;
    }
    var year= date.getFullYear();
    messageObject['date']= '[' + hours + ':'+ minutes + '  ' + day + '.'+ month + '.'+ year+ ']';
    if(messageObject.mode.m==='private'){
      var found = false;
      for(var i = 0; i < users.length;i++){
        if(users[i].name===messageObject.mode.name){
          found=true;
          socket.broadcast.to(users[i].id).emit('chat message', JSON.stringify(messageObject));
          socket.emit('chat message', JSON.stringify(messageObject));
        }
        else{
          if(i==(users.length-1) && found==false){
            socket.emit('chat message failure', ('Chosen user '+messageObject.mode.name+' is not online or name is spelled wrong. Please try again.'));
}
        }
      }
    }else{
      io.emit('chat message',JSON.stringify(messageObject));
    }
  });
  socket.on('user list', function(msg){
    var userlist = "Users online:   " + "<br>";
    for(var i=0; i<users.length; i++){
      userlist = userlist + "<a id=listlink href=users[i].name>" +users[i].name + "</a>" + "<br>";
    }
    socket.emit('user list', userlist);
  });


  socket.on('disconnect', function(){
    for(var i=0; i<users.length; i++){
      if(users[i].id===socket.id){
        var name = users[i].name;
        users.splice(i,1);
        io.emit('user update', 'User '+ name + ' left the chat.');
      }
    }
  });

});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
