
/**
 * Module dependencies.
 */

var express = require('express.io')
  , http = require('http')
  , path = require('path')
  , passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy
  , TwitterStrategy = require('passport-twitter').Strategy
  , redis = require('redis')
  , RedisStore = require('connect-redis')(express)
  , cookieParser = require('connect').utils.parseSignedCookies
  , cookie = require("cookie")
  , async = require("async")
  , config = require('./config.json');

var client = exports.client = redis.createClient();
var sessionStore = new RedisStore({client : client});
var game_lock = false;
var cycle = 0;
var rotationGame = 0;
var cycle_turn = false;
var app = express();
var newuser = false;
//var topic = ["MOVIES","FOODS","PEOPLE","PLACES","GADGETS","COUNTRY","SCHOOL","LITERATURE"];
app.http().io();
var countDownBoolean = false;
var topic;
var listTopic = new Array();
var haveData = new Array();
var myArray = new Array();
var countUserInside = 0;

var temp = 0;
var fs = require('fs');
fs.readFile('topics.txt', function(err, data) {
    if(err) throw err;
    var array = data.toString().split("\n");
    temp = array.length;
    for(i in array) {
        console.log(array[i]);
        listTopic.push(array[i].replace("\r",""));
        temp -= 1;
        if(temp <= 0){
        	displayOutput();
        }
    }
});

function displayOutput(){
	console.log("TOPICS LIST:");
	topic = listTopic;
	console.log(topic);
}

var currentTimeCount = new Date().getTime();
console.log(currentTimeCount);
var setTimeCount = new Date();
setTimeCount.setHours(20);
console.log(setTimeCount);
var computeSample = Math.abs(setTimeCount - currentTimeCount);
console.log(computeSample);
if(computeSample >= 0){
	var secVal = computeSample;
	console.log(Number(secVal));
	secVal1 = Math.ceil((secVal/1000)-1);
	console.log(Number(secVal1));
}else{
	secVal1 = 0;
}

var myCounter = new Countdown({
	seconds: 71000,
	onUpdateStatus: function(sec){},
    //onUpdateStatus: function(sec){console.log(sec);}, // callback for each second
    onCounterEnd: function(){ console.log('counter ended!');
    	console.log("xxXXxx I'm here to Login xxXXxx");
    	countDownBoolean = false;
    	newCounter.start();
    }
});
myCounter.start();
var newCounter = new Countdown({
	seconds:15500,
	onUpdateStatus: function(sec){},
	//onUpdateStatus: function(sec){console.log(sec);}, // callback for each second
    onCounterEnd: function(){ console.log('counter ended!');
    console.log("xxXXxx I'm here to CountDown xxXXxx");
    	countDownBoolean = true;
    	alterCounter.start();
    }
});

var alterCounter = new Countdown({
	seconds:70000,
	onUpdateStatus: function(sec){},
	//onUpdateStatus: function(sec){console.log(sec);}, // callback for each second
    onCounterEnd: function(){ console.log('counter alter!');
    console.log("xxXXxx I'm here to CountDown xxXXxx");
    	countDownBoolean = false;
    	newCounter.start();
    }
});

function Countdown(options) {
    var timer,
    instance = this,
    seconds = options.seconds,
    updateStatus = options.onUpdateStatus || function () {},
    counterEnd = options.onCounterEnd || function () {};

    function decrementCounter() {
        updateStatus(seconds);
        if (seconds === 0) {
            counterEnd();
            instance.stop();
        }
        seconds--;
    }

    this.start = function () {
        clearInterval(timer);
        timer = 0;
        seconds = options.seconds;
        timer = setInterval(decrementCounter, 1000);
    };

    this.stop = function () {
        clearInterval(timer);
    };
}

// all environments
app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser("peekawoo"));
	app.use(express.session({ 
		key: "peekawoo",
		store : sessionStore
		}));
	app.use(passport.initialize());
	app.use(passport.session());
	
	app.use(express.static(path.join(__dirname, 'public')));
	app.use(app.router);
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(obj, done) {
	done(null, obj);
});
	
passport.use(new FacebookStrategy(config.fb,
  function(accessToken, refreshToken, profile, done) {
	profile.photourl = 'http://graph.facebook.com/'+profile.username+'/picture?type=large';
//	console.log("+++facebook profileurl+++");
//	console.log(profile.photourl);
    return done(null, profile);
  }
));

passport.use(new TwitterStrategy(config.tw,
  function(accessToken, refreshToken, profile, done) {
	//profile.photourl = 'http://graph.facebook.com/'+profile.username+'/picture';
	profile.photourl = profile.photos[0].value + '?type=large';
//	console.log("+++twitter profileurl+++");
//	console.log(profile.photourl);
    return done(null, profile);
  }
));



app.get("/",function(req,res){
	if(countDownBoolean){
		res.render('start');
	}else{
		res.render('login');
	}
	//res.render('start');
});

app.get("/login",function(req,res){
	if(countDownBoolean){
		res.render('start');
	}else{
		res.render('login');
	}
	//res.render('start');
});

app.get("/error",function(req,res){
	var removeme = req.user;
	console.log("+++ removing error +++")
	console.log(removeme);
	if(removeme.provider == 'twitter'){
		client.keys('*-'+removeme.id,function(err,value){
			if(value){
				var errorGen = value.search('female-');
				if(errorGen > 0){
					removeme.gender = 'female';
				}else{
					removeme.gender = 'male';
				}
			}
		});
	}
	var again = {};
	again.id = removeme.id;
	again.username = removeme.username;
	again.gender = removeme.gender;
	again.photourl = removeme.photourl;
	again.provider = removeme.provider;
//	console.log(again);
	client.del(removeme.gender+'-'+removeme.id,JSON.stringify(again));
	client.del('chatted:'+removeme.id);
	client.del	('last:'+removeme.id);
//	if(removeme.provider == 'twitter'){
//		again.gender = 'female';
//		client.srem("visitor:female",JSON.stringify(again));
//		again.gender = 'male';
//		client.srem("visitor:male",JSON.stringify(again));
//	}else{
//		client.srem("visitor:"+removeme.gender,JSON.stringify(again));
//	}
	res.render('error');
});

app.get('/authfb',
  passport.authenticate('facebook'));

app.get('/authtw',
		  passport.authenticate('twitter'));

app.get('/authfb/callback',
		passport.authenticate('facebook', { failureRedirect: '/login' }),
		function(req, res) {
			res.redirect('/option');
});

app.get('/authtw/callback',
		passport.authenticate('twitter', { failureRedirect: '/login' }),
		function(req, res) {
			res.redirect('/option');
});

app.get('/subscribe2',function(req,res){
//	console.log("+++++SUBSCRIBE+++++");
//	console.log(req.user);
//	console.log(req.query);
	client.sadd("email",req.query.inputBox);
	var gatherEmail = req.query.inputBox + '\r\n';
	fs.appendFile('email.txt',gatherEmail,function(err){
		if(err) throw err;
		console.log('Email saved');
	});
	res.render('subscribe2');
});

app.get('/option',function(req,res){
	res.render('option',{profile:req.session.passport.user.gender,provider:req.session.passport.user.provider});
});
app.get('/loading',function(req,res){
//	console.log("xxXXX---------------- req.user.gender -----------------XXXxx");
//	console.log(req.user.gender);
//	console.log("xxXXX---------------- req.user._json.gender -----------------XXXxx");
//	console.log(req.user._json.gender);
//	console.log("xxXXX---------------- req.query gender - m -----------------XXXxx");
//	console.log(req.query["gender-m"]);
//	console.log("xxXXX---------------- req.query gender - f -----------------XXXxx");
//	console.log(req.query["gender-f"]);
//	console.log("xxXX checking if req.data exist XXxx");
//	console.log(req.data);
	//if(!req.query["gender-m"] && !req.query["gender-f"])
	var genderStore = new Array();
	if(req.user.provider == 'facebook'){
//		console.log("xxXXX---------------- FACEBOOK GENDER DEFAULT -----------------XXXxx");
		req.user.gender = req.query["gender-m"] || req.query["gender-f"] || req.user._json.gender;
	}else{
		if(rotationGame == 0){
//			console.log("xxXXX---------------- TWITTER GENDER DEFAULT -----------------XXXxx");
			req.user.gender = req.query["gender-m"] || req.query["gender-f"] || req.user._json.gender;
		}
		else{
//			console.log("xxXXX---------------- TWITTER GENDER AUTOMATIC -----------------XXXxx");
			client.keys('*-'+req.user.id,function(err,keys){
				if(keys){
					var locateGen = keys.search('female-');
					console.log(locateGen);
					if(locateGen == 0){
						req.user.gender = 'male';
					}else{
						req.user.gender = 'female';
					}
				}
			});
		}
	}

	req.user.codename = req.query.codename || req.user.codename;
//	console.log("xxXXX---------------- LOADING -----------------XXXxx");
//	console.log(req.user._json);
//	console.log("xxXXX------------------------------------------XXXxx");
//	console.log(req.user.gender);
//	console.log("xxXXX------------------------------------------XXXxx");
	res.render('loading',{user: req.user});
});

app.get('/ranking',function(req,res){
	var user = req.user;
//	console.log(req.user);
	var likes = new Array();
	var finalLikes = new Array();

	var finishedRequest = function(){
		if(user.provider == 'twitter'){
			client.keys('*-'+user.id,function(err,value){
				if(value){
					var errorGen = value.search('female-');
					if(errorGen > 0){
						user.gender = 'female';
					}else{
						user.gender = 'male';
					}
				}
			});
		}
		var up = {};
		up.id = user.id;
		up.username = user.username;
		up.gender = user.gender;
		up.photourl = user.photourl;
		up.provider = user.provider;
		up.codename = user.codename;
		console.log("+++++UP content+++++");
//		console.log(up);
		console.log("+++++UP content+++++");
//		console.log(finalLikes);
		res.render('ranking',{user:up,chatmate:finalLikes});
	}
	
	client.smembers('visitor:'+user.id,function(err,datas){
//		console.log("+++++Data Content Query+++++");
//		console.log(datas);
//		console.log(datas.length);
		var countData;
		countData = datas.length;
//		console.log("xxXXxx Count Content Value xxXXxx");
//		console.log(countData);
		if(countData > 0){
			datas.forEach(function(data){
//				console.log("xxXXxx PEOPLE WHO LIKE YOU");
//				console.log(data);
				//countData = data.length;
				//console.log(countData);
				likes.push(data);
				client.smembers('visitor:'+JSON.parse(data).id,function(err,liked){
					if(!liked[0]){
						console.log("xxXXxx NO ONE LIKE YOU xxXXxx");
						liked = {};
					}
					else{
						console.log("xxXXxx OTHER PEOPLE LIKE DATA xxXXxx");
						console.log(liked);
						liked.forEach(function(like){
							console.log("xxXXxx LIKE DATA xxXXxx");
							console.log(like);
							if(JSON.parse(like).id == req.user.id){
								console.log("xxXXxx RESULT OF LIKE xxXXxx");
								finalLikes.push(datas);
							}
						});
					}
					countData-=1;
					if(countData <= 0){
						finishedRequest();
					}
				});
				
	
			});
		}else{
			finishedRequest();
		}
			
	});
});

app.get('/chat/:room',function(req,res){
	console.log("******req only******");
	//console.log(req);
	//console.log(req.data);
	console.log(req.params);
	console.log("******req.params.room******");
	console.log(req.params.room);
	client.smembers(req.params.room,function(err,data){
		console.log(err);
		console.log(data);
		if(err){
			data = {};
		}
		else{
			data = JSON.parse(data[0]);
		}
		console.log(data);
		console.log(req.user.photourl);
		//coansole.log("error create");
		var container;
		//var listgender = new Array();
		var listgender = new Array();
		if(req.user.provider == 'twitter'){
			client.keys('*-'+req.user.id,function(err,result){
				if(result){
					var trimGet = result.search('female-');
					if(trimGet > 0){
						req.user.gender = 'female';
					}else{
						req.user.gender = 'male';
					}
				}
			});
		}
		//if(req.user.gender == data.male.gender){
		//	container = data.female.gender;
		//}else{
		//	container = data.male.gender;
		//}
		var up = {};
		console.log("****GENDER IF Twitter USE****");
		up.id = req.user.id;
		up.username = req.user.username;
		up.gender = req.user.gender;
		up.photourl = req.user.photourl;
		up.provider = req.user.provider;
		up.codename = req.user.codename;
		client.lrange('last:'+req.user.id,1,1,function(err,value){
			if(err){
				console.log("Error found!!");
				
			}
			//listgender = JSON.parse(value);
			console.log("$$$$$ checking if value.length have content $$$$$")
			console.log(value.length);
			//if()
			console.log("****LIST of Opposite Gender****");
			console.log(listgender);
			if(value.length > 0){
				if(req.user.gender == 'male'){
					console.log("search female");
					client.get('female-'+value,function(err,values){
						console.log(values);
						console.log(JSON.parse(values));
						res.render('chat',{user: up, room: data, listgen: values});
					});
				}else{
					console.log("search male");
					client.get('male-'+value,function(err,values){
						console.log(values);
						console.log(JSON.parse(values));
						res.render('chat',{user: up, room: data, listgen: values});
					});
				}
			}
			else{
				console.log("yyyyyyyy null value yyyyyyyy");
				listgender = value;
				res.render('chat',{user: up, room: data, listgen: listgender});
			}
		});
		//client.smembers("visitor:"+container,function(err,results){
		//	console.log("****LIST of Opposite Gender****");
		//	console.log(listgender);
		//	results.forEach(function(key){
		//		console.log(key);
		//		console.log(JSON.parse(key));
		//		listgender.push(JSON.parse(key));
		//	});
			//outside the smembers put dated 9-4-13 10:22am
		//	console.log("****Complete List of Opposite Gender****");
		//	console.log(listgender);
		//	var up = {};
			//if(req.user.provider=='twitter'){
		//	gender = req.user.gender;
		//	console.log("****GENDER IF Twitter USE****");
		//	console.log(gender);
		//	up.gender = req.user.gender;
		//	up.id = req.user.id;
		//	up.username = req.user.username;
		//	up.photourl = req.user.photourl;
		//	up.provider = req.user.provider;
		//	up.codename = req.user.codename;
		
	});
});

app.io.set('log level', 1);
app.io.set('authorization', function (handshakeData, callback) {
	if(handshakeData.headers.cookie){
		console.log("xxXX Cookie XXxx");
//		console.log(handshakeData.headers.cookie);
		var cookies = handshakeData.headers.cookie.replace("'","").split(";");
		console.log("declaration");
		console.log(cookies);
		console.log("checking cookies");
//		console.log(cookies.length);
		for(var i = 0; i<cookies.length; i++){
			var checkMe = cookies[i].search("peekawoo=");
			console.log("cookies that check"+cookies[i]);
			console.log(checkMe);
			if(checkMe >= 0){
				console.log("i'm at Array number "+i+" location "+checkMe);
				var sampleMe = cookies[i].split("=");
				if(sampleMe.length > 1){
					console.log("goes greater");
					sampleMe = sampleMe[1].split("=");
				}
				else{
					console.log("goes lessthan");
					sampleMe = sampleMe[0].split("=");
				}
				break;
			}
		}
		console.log("here is the perfect result");
//		console.log(sampleMe);
		sid = sampleMe[0].replace("s%3A","").split(".")[0];
		console.log("checking cookies");
		console.log(sid);
//		console.log(sampleMe);
		sessionStore.load(sid, function(err,session){
//			console.log(session);
			if(err || !session){
				return callback("Error retrieving session!",false);
			}
			console.log("xxXX Before XXxx");
//			console.log(handshakeData.peekawoo);
			handshakeData.peekawoo = {
					user : session.passport.user,
					sessionid : sid
			};
			console.log("xxXX After XXxx");
			console.log(handshakeData.peekawoo);
			console.log("===== Connecting . . . =====");
			//console.log(handshakeData);
			return callback(null,true);
		});
		console.log("it just end here");
	}
	else{
		return callback("No cookie transmitted.!",false);
	}
	
});

app.io.set('store', new express.io.RedisStore({
    redisPub: redis.createClient(),
    redisSub: redis.createClient(),
    redisClient: client
}));

app.io.sockets.on('connection',function(socket){
	console.log("xxXX connecting clients . . . XXxx");
	//console.log(socket);
	console.log(socket.handshake);
	console.log("xxX pushing socket.id Xxx");
	var userx = socket.handshake.peekawoo.user;
	var usery = socket.handshake.peekawoo.sessionid;
	client.persist(userx.gender+'-'+userx.id);
	socket.on('disconnect',function(){
		client.expire(userx.gender+'-'+userx.id,60);
	});

	console.log("===================");
//	console.log(socket.handshake.peekawoo.user);
	console.log("===================");
	var user = socket.handshake.peekawoo.user;
	console.log("+++++++++++++");
//	console.log(user);
	console.log("+++++++++++++");
	app.io.route('join',function(req){
		console.log("++++checking req.data.room ++++");
		console.log(req.data);
		console.log(req.data.room);
		req.io.join(req.data.room);
		app.io.room(req.data.room).broadcast('roomtopic',topic[Math.floor(Math.random() * topic.length)]);
	});
	
	app.io.route('reload',function(req){
		console.log("+++ removing due to reloading page +++");
		console.log(req.data);
		var removehere = req.data;
		var again = {};
		again.id = removehere.id;
		again.username = removehere.username;
		again.gender = removehere.gender;
		again.photourl = removehere.photourl;
		again.provider = removehere.provider;
		console.log(again);
		if(removehere.provider == 'twitter'){
			again.gender = 'female';
			client.srem("visitor:female",JSON.stringify(again));
			again.gender = 'male';
			client.srem("visitor:male",JSON.stringify(again));
		}else{
			client.srem("visitor:"+removehere.gender,JSON.stringify(again));
		}
	});
	
	app.io.route('leave',function(req){
		console.log("++++signout req.data.room++++");
		console.log(req.data.room);
		console.log("++++signout req.data.user++++");
		console.log(req.data.user);
		console.log("+++++removing gender and room declare+++++");
		var removegender;
		if(req.data.user.id == req.data.room.male.id){
			removegender = req.data.room.male;
		}else{
			removegender = req.data.room.female;
		}
		var removeroom = req.data.room;
		console.log(removegender);
		console.log(removeroom);
		console.log("+++++removing gender+++++");
		delete removegender.codename;
		console.log(removegender);
		client.srem("visitor:"+removegender.gender,JSON.stringify(removegender));
		client.del("chatted:"+removegender.id);
		client.del(removeroom.name);
		console.log("@@@@@ D O N E  R E M O V I N G @@@@@");
	});
	
	app.io.route('insert',function(req){
		var user = req.data.user;
		var mate = req.data.mate;
		console.log("====user value====");
		console.log(user);
		console.log("====remove msg====");
		delete req.data.user.msg;
		console.log(user);
		console.log("====mate value====");
		console.log(mate);
		console.log("====remove if exist====");
		client.srem("visitor:"+mate.id,JSON.stringify(user));
		console.log("====add user to mate====");
		client.sadd("visitor:"+mate.id,JSON.stringify(user));
	});
	
	app.io.route('uninsert',function(req){
		var user = req.data.user;
		var mate = req.data.mate;
		console.log("====user value====");
		console.log(user);
		console.log("====remove msg====");
		delete req.data.user.msg;
		console.log(user);
		console.log("====mate value====");
		console.log(mate);
		console.log("====Delete me in my chatmate====");
		//client.smembers(mate.id,function(callback){
		//	console.log("====callback value====");
		//	console.log(callback);
		//});
		client.srem("visitor:"+mate.id,JSON.stringify(user));
		//client.sadd("visitor:"+mate.id,JSON.stringify(user));
	});
	
	app.io.route('my msg',function(req){
		console.log("my msg location");
		//console.log(req);
		app.io.room(getRoom(req)).broadcast('new msg', req.data);
	});

	app.io.route('member', function(req) {
		async.auto({
			checkIfExist : function(callback){
				console.log("checking if goes in here");
				var gender = JSON.parse(req.data);
				var me = {};
				me.id = gender.id;
				me.username = gender.username;
				me.gender = gender.gender;
				me.photourl = gender.photourl;
				me.provider = gender.provider;
				//client.sismember("visitor:"+me.gender,JSON.stringify(me),callback);
				//client.sismember(me.gender+"-"+me.id,JSON.stringify(me),callback);
				client.exists(me.gender+"-"+me.id,callback);
			},
			setMember : function(callback){
				console.log("checking again");
				var user = JSON.parse(req.data);
				var up = {};
				up.id = user.id;
				up.username = user.username;
				up.gender = user.gender;
				up.photourl = user.photourl;
				up.provider = user.provider;
				//client.srem("visitor:"+user.gender,JSON.stringify(up));
				//client.srem(user.gender+"-"+user.id,JSON.stringify(up));
				//client.sadd("visitor:"+user.gender,JSON.stringify(up));
				client.del(user.gender+"-"+user.id,JSON.stringify(up),redis.print);
				client.set(user.gender+"-"+user.id,JSON.stringify(up),redis.print);
				console.log(up);
				console.log("checking if goes in here again");
				callback(null,true);
			},
			getMaleVisitor : function(callback){
				//client.smembers("visitor:male",callback);
				client.keys('male-*',callback);
			},
			getFemaleVisitor : function(callback){
				//client.smembers("visitor:female",callback);
				client.keys('female-*',callback);
			}
		},function(err,result){
			console.log(result);
			if(result.checkIfExist == 0){
				console.log("NOTHING");
				console.log(result.checkIfExist);
				console.log("xxXXxx IM NEW HERE xxXXxx");
				newuser = true;
			}
			else{
				console.log("xxXXxx IM ALREADY HERE BEFORE xxXXxx");
				newuser = false;
			}
			//Change condition if male == female
			if(result.getMaleVisitor.length >= 1 && result.getFemaleVisitor.length >= 1){
				console.log("xxXXxx NEWUSER Result xxXXxx");
				console.log(newuser);
				console.log(game_lock);
				if(newuser){
					if(!game_lock){
						var cm = result.getMaleVisitor;
						var cf = result.getFemaleVisitor;
						console.log("content value of result");
						console.log(cm);
						console.log(cf);
						game_lock = true;
						console.log("starting game in 30 sec");
						setTimeout(function(){
							start_game(cm,cf);
						},30000);
					}
				}
			}
		});
	});
});

start_chat = function(vf,vm,cycle){
	console.log("@@@@@@@@@@@@@ Chat start");
	
	async.auto({
		group_user : function(){
			var rooms = new Array();
			var new_vm = new Array();
			var lowestLength = Math.min(vf.length,vm.length);
			var priority;
			var maleList = vm;
			var femaleList = vf;
			if(vf.length == lowestLength){
				priority = "female";
			}else{
				priority = "male";
			}
			console.log(lowestLength);
			for(var i=0; i<lowestLength; i++){
				console.log("female length");
				console.log(vf.length);
				console.log("female content");
				console.log(vf[i]);
				console.log("male content");
				console.log(vm[i]);
				//if(vf[i] && vm[i]){
				var vfs = JSON.parse(vf[i]);
				var vms = JSON.parse(vm[i]);
				console.log("json parse of vm and vf");
				console.log(vfs);
				console.log(vms);
				if(priority == "female"){
					console.log("female is the priority");
					var vmx;
					for(var j = 0;j<vm.length; j++){
						console.log("goes to this location loop for");
						vmx = JSON.parse(vm[j]);
						client.sismember("chatted:"+vfs.id,vmx.id,function(already){
							if(already == 1){
								//app.io.broadcast(vfs.id, false);
								//break;
							}
							else{
								var checkingMaleIn = maleList.indexOf(JSON.stringify(vmx));
								console.log("$$$$$ check if male is available $$$$$");
								console.log(checkingMaleIn);
								if(checkingMaleIn >= 0){
									var room = {
											name : vmx.id + "-" + vfs.id,
											male : vmx,
											female : vfs
										}
									//var checkIfAvailable = maleList.i
									//if()
									client.del(room.name,JSON.stringify(room));
									client.sadd(room.name,JSON.stringify(room));
									console.log("++++++getting blank room++++++");
									console.log(room);
									console.log("++++++++++++++++++++++++++++++");
									rooms.push(room);
									console.log("++++Start Conversation++++");
									console.log(rooms);
									console.log("++++++++++++++++++++++++++");
									var removeInListFemale = femaleList.indexOf(JSON.stringify(vfs));
									femaleList.splice(removeInListFemale,1);
									var removeInListMale  = maleList.indexOf(JSON.stringify(vmx));
									maleList.splice(removeInListMale,1);
									client.sadd("chatted:"+vfs.id,vmx.id);
									client.sadd("chatted:"+vmx.id,vfs.id);
									client.lpush("last:"+vfs.id,vmx.id);
									client.lpush("last:"+vmx.id,vfs.id);
									app.io.broadcast(vfs.id, room);
									app.io.broadcast(vmx.id, room);
								}
							}
						});
						break;
					}
				}else{
					console.log("male is the priority");
					var vfx;
					for(var k = 0;k<vf.length; k++){
						console.log("goes to this location loop for");
						vfx = JSON.parse(vf[k]);
						client.sismember("chatted:"+vms.id,vfx.id,function(already){
							if(already == 1){
								//app.io.broadcast(vfs.id, false);
								//break;
							}
							else{
								var checkingFemaleIn = femaleList.indexOf(JSON.stringify(vfx));
								console.log("$$$$$ check if female is available $$$$$");
								console.log(checkingFemaleIn);
								if(checkingFemaleIn >= 0){
									var room = {
											name : vms.id + "-" + vfx.id,
											male : vms,
											female : vfx
										}
									client.del(room.name,JSON.stringify(room));
									client.sadd(room.name,JSON.stringify(room));
									console.log("++++++getting blank room++++++");
									console.log(room);
									console.log("++++++++++++++++++++++++++++++");
									rooms.push(room);
									console.log("++++Start Conversation++++");
									console.log(room);
									console.log("++++++++++++++++++++++++++");
									//client.sadd("chatted:"+vfs.id,vms.id);
									//client.sadd("chatted:"+vms.id,vfs.id);
									var removeInListMale  = maleList.indexOf(JSON.stringify(vms));
									maleList.splice(removeInListMale,1);
									var removeInListFemale = femaleList.indexOf(JSON.stringify(vfx));
									femaleList.splice(removeInListFemale,1);
									client.sadd("chatted:"+vfx.id,vms.id);
									client.sadd("chatted:"+vms.id,vfx.id);
									client.lpush("last:"+vfx.id,vms.id);
									client.lpush("last:"+vms.id,vfx.id);
									app.io.broadcast(vfx.id, room);
									app.io.broadcast(vms.id, room);
								}
								//break;
							}
						});
						break;
					}
				}
			}
			setTimeout(function(){
				console.log("@@@@@CYCLE@@@@@");
				console.log(cycle);
				console.log(rooms.length);
				//cycle = cycle + 1;
				//if(cycle < rooms.length){
					//start_chat(vf,new_vm,cycle);
					console.log("XXXX HERE IT GOES inside XXXX");
					//cycle_turn = true;
					//start_chat(vf,new_vm,cycle);
				//}
				//else{
					//game_lock = false;
					//app.io.broadcast('game_stop', true);
				//	console.log("XXXX HERE IT GOES outside XXXX");
				//	rotationGame = rotationGame + 1;
				//	console.log("rotationGame");
				//	console.log(rotationGame);
				if(!newuser){
					//cycle_turn = true;
					
					game_lock = true;
					start_chat(vf,vm,cycle);
				}else{
					game_lock = false;
					app.io.broadcast('game_stop', true);
				}
				//}
			},30000);
		},
		
	},function(err,result){
		
	});
};

start_game = function(cm,cf){
	async.auto({
		getMaleVisitor : function(callback){
			console.log("function get male");
			console.log(cm);
			console.log(cm.length);
			client.mget(cm,callback);
		},
		getFemaleVisitor : function(callback){
			console.log("function get female");
			console.log(cf);
			console.log(cf.length);
			client.mget(cf,callback);
		},
		assignRoom : ['getMaleVisitor','getFemaleVisitor',function(callback,result){
			var vf = result.getFemaleVisitor;
			var vm = result.getMaleVisitor;
			console.log("@@@@@@@@@@@@@ Room Assigned");
			console.log(vf);
			console.log(vm);
			console.log("@@@@@@@@@@@@@ Room Assigned");
			start_chat(vf,vm,0);
		}]
	});
};

function getRoom(req){
	var rooms = req.io.manager.roomClients[req.io.socket.id];
	var room = "";
	
	for(var i in rooms){
	if(i != '' && room == ""){
		room = i.replace('/','');
	}
	}
	console.log(room);
	return room;
	}

client.keys('*', function(err, keys) {
	if(keys){
		keys.forEach(function(key){client.del(key);});
	}
    console.log('Deletion of all redis reference ', err || "Done!");
});

app.listen(80);
