//var socket = io.connect(window.location.origin,{'sync disconnect on unload':true});
var socket = io.connect();
var user = $("#user").val();
socket.emit('member',user);
user = JSON.parse(user);
socket.on(user.id,function(data){
	console.log(data);
	if(data){
		window.location = '/chat/'+data.name;
	}
	else{
		window.location = '/error';
	}
});

socket.on('game_stop',function(){
	window.location = '/loading';
});
setTimeout(function(){
	window.location = '/error';
},120000);
