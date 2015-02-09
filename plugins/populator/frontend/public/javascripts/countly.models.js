(function (countlyPopulator, $, undefined) {
	var props = {
		_os: ["Android", "iOS", "WP8"],
		_os_version: ["2.2", "2.3", "3.1", "3.2", "4.0", "4.1", "4.2", "4.3", "4.4", "5.0", "5.1", "6.0", "6.1", "7.0", "7.1", "8.0", "8.1"],
		_resolution: ["320x480", "768x1024", "640x960", "1536x2048", "320x568", "640x1136", "480x800", "240x320", "540x960", "480x854", "240x400", "360x640", "800x1280", "600x1024", "600x800", "768x1366", "720x1280", "1080x1920"],	
		_device: ["One Touch Idol X", "Kindle Fire HDX", "Fire Phone", "iPhone 5", "iPhone Mini", "iPhone 4S", "iPhone 5C", "iPad 4", "iPad Air","iPhone 6","Nexus 7","Nexus 10","Nexus 4","Nexus 5", "Windows Phone", "One S", "Optimus L5", "Lumia 920", "Galaxy Note", "Xperia Z"],
		_manufacture: ["Samsung", "Sony Ericsson", "LG", "Google", "HTC", "Nokia", "Apple", "Huaiwei", "Lenovo", "Acer"],
		_carrier: ["Telus", "Rogers Wireless", "T-Mobile", "Bell Canada", "	AT&T", "Verizon", "Vodafone", "Cricket Communications", "O2", "Tele2", "Turkcell", "Orange", "Sprint", "Metro PCS"],
		_app_version: ["1.0", "1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8", "1.9", "2.0", "2.1", "2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8", "2.9", "3.0", "3.1", "3.2"]
	};
	var metrics = ["_os", "_os_version", "_resolution", "_device", "_carrier", "_app_version"];
	var events = ["Login", "Logout", "Buy", "Purchase", "Lost", "Won", "Achievement", "Shared", "Sound", "Messaged"];
	var segments  = {
		Login: {referer: ["twitter", "notification", "unknown"]},
		Buy: {screen: ["End Level", "Main screen", "Before End"]},
		Lost: {level: [1,2,3,4,5,6,7,8,9,10,11], mode:["arcade", "physics", "story"], difficulty:["easy", "medium", "hard"]},
		Won: {level: [1,2,3,4,5,6,7,8,9,10,11], mode:["arcade", "physics", "story"], difficulty:["easy", "medium", "hard"]},
		Achievement: {name:["Runner", "Jumper", "Shooter", "Berserker", "Tester"]},
		Sound: {state:["on", "off"]}
	};
	var crashProps = ["root", "ram_current", "ram_total", "disk_current", "disk_total", "bat_current", "bat_total", "orientation", "stack", "log", "custom", "features", "settings", "comment", "os", "os_version", "manufacture", "device", "resolution", "app_version"];
	function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	function capitaliseFirstLetter(string)
	{
		return string.charAt(0).toUpperCase() + string.slice(1);
	}
	function createRandomObj(fieldCount)
	{
		var generatedObj = {};
	
		for(var i = 0; i < fieldCount; i++) {
			var generatedObjField;
	
			switch(getRandomInt(0,4)) {
	
				case 0:
				generatedObjField = getRandomInt(0,1000);
				break;
	
				case 1:
				generatedObjField = Math.random();
				break;
	
				case 2:
				generatedObjField = Math.random() < 0.5 ? true : false;
				break;
	
				case 3:
				generatedObjField = randomString(getRandomInt(0,4) + 4);
				break;
	
				case 4:
				generatedObjField = null;
				break;
			}
			generatedObj[randomString(8)] = generatedObjField;
		}
		return generatedObj;
	}
	
	// helper functions
	
	function randomString(size)
	{
		var alphaChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
		var generatedString = '';
		for(var i = 0; i < size; i++) {
			generatedString += alphaChars[getRandomInt(0,alphaChars.length)];
		}
	
		return generatedString;
	}
	function user(id){
		this.getId = function() {
			function s4() {
				return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
			};
			return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
		};
		
		this.getProp = function(name){
			return props[name][Math.floor(Math.random()*props[name].length)];
		};
		
		var that = this;
		this.id = this.getId();
		this.isRegistered = false;

		this.hasSession = false;
		this.ip = chance.ip();
		this.userdetails = {name: chance.name(), username: chance.twitter().substring(1), email:chance.email(), organization:capitaliseFirstLetter(chance.word()), phone:chance.phone(), gender:chance.gender().charAt(0), byear:chance.birthday().getFullYear(), custom:createRandomObj(6)};
		this.metrics = {};
		this.startTs = startTs;
		this.endTs = endTs;
		this.ts = getRandomInt(this.startTs, this.endTs);
		var prop;
		for(var i = 0, l = metrics.length; i < l; i++){
			prop = metrics[i];
			this.metrics[prop] = this.getProp(prop);
		}
		
		this.getCrash = function(){
			var crash = {};
			crash._root = (Math.random() > 0.5) ? true : false;
			crash._wifi = (Math.random() > 0.5) ? true : false;
			crash._ram_total = getRandomInt(1, 4)*1024;
			crash._ram_current = getRandomInt(1, crash._ram_total);
			crash._disk_total = getRandomInt(1, 20)*1024;
			crash._disk_current = getRandomInt(1, crash._disk_total);
			crash._bat_total = 100;
			crash._bat_current = getRandomInt(1, crash._bat_total);
			crash._orientation = (Math.random() > 0.5) ? "landscape" : "portrait";
			crash._os = "Android";
			crash._os_version = this.getProp("_os_version");
			crash._device = this.getProp("_device");
			crash._manufacture = this.getProp("_manufacture");
			crash._resolution = this.getProp("_resolution");
			crash._app_version = this.getProp("_app_version");
			crash._error = this.getError();
			return crash;
		};
		
		this.getError = function(){
			var errors = ["java.lang.RuntimeException", "java.lang.NullPointerException", "java.lang.NoSuchMethodError", "java.lang.NoClassDefFoundError", "java.lang.ExceptionInInitializerError", "java.lang.IllegalStateException"];
			var error = errors[Math.floor(Math.random()*errors.length)]+": com.domain.app.Exception<init>\n";
			var stacks = getRandomInt(1, 6);
			for(var i = 0; i < stacks; i++){
				var file = chance.word();
				error += "at com.domain.app."+file+".<init>("+file+".java:"+getRandomInt(1, 256)+")\n";
			}
			return error;
		};
		
		this.getEvent = function(id){
			if(!id){
				id = events[Math.floor(Math.random()*events.length)];
			}
			var event = {
				"key": id,
				"count": 1
			};
			if(id == this.iap)
				event.sum = getRandomInt(100, 500)/100;
			if(segments[id]){
				var segment;
				event.segmentation = {};
				for(var i in segments[id]){
					segment = segments[id][i];
					event.segmentation[i] = segment[Math.floor(Math.random()*segment.length)];
				}
			}
			return [event];
		};
		
		this.startSession = function(){
			this.ts = getRandomInt(this.startTs, this.endTs);
			stats.s++;
			if(!this.isRegistered){
				this.isRegistered = true;
				stats.u++;
				this.request({timestamp:this.ts, begin_session:1, metrics:this.metrics, user_details:this.userdetails});
			}
			else{
				stats.e++;
				this.request({timestamp:this.ts, begin_session:1, events:this.getEvent("Login")});
			}
			this.hasSession = true;
			this.timer = setTimeout(function(){that.extendSession()}, timeout);
		};
		
		this.extendSession = function(){
			if(this.hasSession){
				this.ts = this.ts + 30;
				stats.x++;
				stats.d += 30;
				stats.e++;
				this.request({timestamp:this.ts, session_duration:30});	
				this.request({timestamp:this.ts, events:this.getEvent()});	
				if(Math.random() > 0.5){
					this.timer = setTimeout(function(){that.extendSession()}, timeout);
				}
				else
					this.endSession();
			}
		}
		
		this.endSession = function(){
			if(this.timer){
				clearTimeout(this.timer)
				this.timer = null;
			}
			if(this.hasSession){
				this.hasSession = false;
				stats.e++;
				this.request({timestamp:this.ts, end_session:1, events:this.getEvent("Logout")});
			}
		};
		
		this.request = function(params){
			stats.r++;
			params.device_id = this.id;
			params.ip_address = this.ip;
			bulk.push(params);
			countlyPopulator.sync();
		};
	}
	
	var bulk = [];
	var startTs = 1356998400;
	var endTs = new Date().getTime()/1000;
	var timeout = 1000;
	var bucket = 50;
	var generating = false;
	var users = [];
	var queued = 0;
	var stats = {u:0,s:0,x:0,d:0,e:0,r:0};
	var totalStats = {u:0,s:0,x:0,d:0,e:0,r:0};
	
	function updateUI(stats){
		for(var i in stats){
			totalStats[i] += stats[i];
			$("#populate-stats-"+i).text(totalStats[i]);
		}
	}
	
	//Public Methods
	countlyPopulator.setStartTime = function(time){
		startTs = time;
	};
	countlyPopulator.setEndTime = function(time){
		endTs = time;
	};
	countlyPopulator.generateUsers = function (amount) {
		bulk = [];
		bucket = Math.max(amount/5, 10);
		var mult = (Math.round(queued/10)+1);
		timeout = bucket*100*mult*mult;
		generating = true;
		function createUser(){
			var u = new user();
			users.push(u);
			u.timer = setTimeout(function(){
				u.startSession();
			},Math.random()*timeout);
		}
		function processUser(u){
			if(u && !u.hasSession){
				u.timer = setTimeout(function(){
					u.startSession();
				},Math.random()*timeout);
			}
		}
		for(var i = 0; i < amount; i++){
			createUser();
		}
		function processUsers(){
			for(var i = 0; i < amount; i++){
				processUser(users[i]);
			}
			if(users.length > 0 && generating)
				setTimeout(processUsers, timeout);
			else
				countlyPopulator.sync(true);
		}
		
		setTimeout(processUsers, timeout);
	};
	
	countlyPopulator.stopGenerating = function () {
		generating = false;
		var u;
		for(var i = 0; i < users.length; i++){
			u = users[i];
			if(u)
				u.endSession();
		}
		users = [];
	};
    
    countlyPopulator.sync = function (force) {
		if(generating && (force || bulk.length > bucket)){
			var temp = {};
			for(var i in stats){
				temp[i] = stats[i];
			}
			stats = {u:0,s:0,x:0,d:0,e:0,r:0};
			queued++;
			var mult = Math.round(queued/10)+1;
			timeout = bucket*100*mult*mult;
			$("#populate-stats-br").text(queued);
			$.ajax({
				type:"POST",
				url:countlyCommon.API_URL + "/i/bulk",
				data:{
					app_key:countlyCommon.ACTIVE_APP_KEY,
					requests:JSON.stringify(bulk)
				},
				success:function (json) {
					queued--;
					$("#populate-stats-br").text(queued);
					updateUI(temp);
				},
				error:function(){
					queued--;
					$("#populate-stats-br").text(queued);
				}
			});
			bulk = [];
		}
    };
	
}(window.countlyPopulator = window.countlyPopulator || {}, jQuery));