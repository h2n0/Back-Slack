//The file where all the magic happens

function $(id){
	return document.getElementById(id);
}


let lastChannel = null;
let threadActive = false;

//Toggle the active state in the channelList
function toggle(channel){
	if(lastChannel){
		lastChannel.classList.remove("active");
	}
	channel.classList.add("active");
	lastChannel = channel;
}

//Toggle the visibility of the Thread panel
function toggleThread(actual){
	if(actual != undefined){
		if(actual){
			if(threadActive)return;
			$("thread").classList.add("active");
			threadActive = true;	
		}else{
			if(!threadActive)return;
			$("thread").classList.remove("active");
			threadActive = false;
		}
	}else{
		$("thread").classList.toggle("active");
		threadActive = !threadActive;
	}
}


/**
	Construct a message with the provided input
	===================
	threadID = int
	username = string
	time = float
	msg = string
	thread = boolean
	===================
	return string
**/
function makeMessage(threadID, username, time, msg, thread){
	let d = new Date(0);
	d.setUTCSeconds(time);
	let dateString = "" + ((""+(d.getHours()%12)).padStart(2, "0")) + ":" + (""+d.getMinutes()).padStart(2,"0") + " " + ((""+d.getHours()).padStart(2, "0") > 12?"PM":"AM") + " - " + (""+d.getDate()).padStart(2, "0") + "/" + (""+d.getMonth()).padStart(2, "0") + "/" + (""+d.getFullYear()).substring(2);
	let p = "<p class='username'>" + username + " <span>" + dateString + "</span></p>";
	let m = "<p>" + msg + "</p>";
	let res = p + m;
	
	if(thread){
		res += "<strong onclick=thread(this)>THREAD!</strong>";
	}
	return "<li threadID=" + threadID + " class='channelMessage " + (threadID%2==0?"messageEven":"") + "'>" + res + "</li>";
}

/**
	Called to fill the content element with the first 50 messages or the inner of  a channel object
	==============
	messages = array of messages (see parse.js)
	users = hash of users (see parse.js)

**/
function fillContent(messages, users, last){

	if(typeof(messages) == "string"){
		$("content").children[0].innerHTML = messages;
		return;
	}
	$("content").children[0].innerHTML = "";
	let lastMessageID = 0;
	
	for(var i = 0; i < (last?last:50); i++){
		if(!messages[i])break;
		$("content").children[0].innerHTML += makeMessage(i, users[messages[i].user], messages[i].ts, messages[i].text, messages[i].thread?true:false);
		lastMessageID = i;
	}
	
	lastMessageID++;
	if(messages.length > lastMessageID){
		$("content").children[0].innerHTML += "<p LoadMore=true>LoadMore!</p>";
	}
	
	return {inner:$("content").children[0].innerHTML, last: lastMessageID};
}

function appendContent(messages, users, lastMessageID, callback){
	if(messages.length == lastMessageID)return;
	//console.log(lastMessageID);
	$("channelMessages").removeChild($("channelMessages").children[$("channelMessages").children.length-1]);
	let amt = 30;
	let actual = 0;
	for(var i = lastMessageID; i < lastMessageID + amt; i++){
		//console.log(i);
		if(!messages[i])break;
		$("content").children[0].innerHTML += makeMessage(lastMessageID + actual, users[messages[i].user], messages[i].ts, messages[i].text, messages[i].thread?true:false);
		actual++;
	}
	
	lastMessageID += actual + 1;
	if(messages.length > lastMessageID){
		$("content").children[0].innerHTML += "<p LoadMore=true>LoadMore!</p>";
	}
	
	
	if(callback){
		callback({inner:$("content").children[0].innerHTML, last: lastMessageID});
	}else{
		return {inner:$("content").children[0].innerHTML, last: lastMessageID};
	}
}


/**
	Fix the slack formatting of strings
	===============
	chans = array of channel objects (see parse.js)
	users = array of users (see parse.js)
	msgs = array of messages (see parse.js)
	===============
	returns array of messages

**/
function fixFormatting(chans, users, msgs){
	for(var i = 0; i < msgs.length; i++){
		let c = msgs[i];
		if(c.replies){
			if(c.replies.length > 0){
				fixFormatting(chans, users, c.replies);
			}
		}
	
		let reg = /(<(.*?)>)/g; // Looking for anything held between '<' & '>'
		let parts = c.text.match(reg);
		if(parts){
			for(var j = 0; j < parts.length; j++){
				let cp = parts[j].substring(1, parts[j].length-1);
				if(cp.indexOf("|") != -1){// Channel reference
					let chanID = cp.substring(0, cp.indexOf("|"));
					let chanText = cp.substring(cp.indexOf("|")+1);
					msgs[i].text = msgs[i].text.replace(parts[j], "<span onclick=changeToChannel('"+chanID+"') class='chanRef'>#"+chanText+"</span>");
				}else if(cp.indexOf("@") != -1){// User mention
					//console.log(msgs[i]);
					msgs[i].text = msgs[i].text.replace(parts[j], "<span class='userMention'>@"+users[cp.substring(1)]+"</span>");
				}else{
				
				}
			}
		}
		
		reg = /(\*(.*?)\*)/g;// Looking for bold
		parts = c.text.match(reg);
		if(parts){
			for(var j = 0; j < parts.length; j++){
				let cp = parts[j].substring(1,parts[j].length-1);
				msgs[i].text = msgs[i].text.replace(parts[j], "<span class='bold'>"+cp+"</span>");
			}
		}
		
		reg = /_(.*?)_/g;// Looking for italic
		parts = c.text.match(reg);
		if(parts){
			for(var j = 0; j < parts.length; j++){
				let cp = parts[j].substring(1,parts[j].length-1);
				msgs[i].text = msgs[i].text.replace(parts[j], "<span class='italic'>"+cp+"</span>");
			}
		}
		
		reg = /(\n)/g; // Looking for new lines
		msgs[i].text = msgs[i].text.replace(reg, "<br>");
	}
	return msgs;
}

// If we have data we can populate and proceseed with the program
if( hasData() ){
	let chans = getChannels();
	let users = getUsers();
	let lastMessages = null;
	let lastMessageID = 0;
	let channelIndex = 0;
	let canUpdate = false;

	// Populate the channel side bar
	for(var i = 0; i < chans.length; i++){
		$("channelList").innerHTML += "<li>"+ chans[i].name +"</li>";
		chans[i].fixed_messages = fixFormatting(chans, users, chans[i].raw_messages);
	}
	
	//Add mouse event to it
	$("channelList").onmousedown = (e) => {
	
		if(e.target.nodeName == "LI"){
			channelIndex = -1;
			for(var i = 0; i < chans.length; i++){
				if(chans[i].name == e.target.innerHTML){
					channelIndex = i;
					break;
				}
			}
			if(channelIndex == -1){ // If we didn't find the channel move on
				alert("Couldn't find channel");
				return;
			}
			scrollToTop();
			toggle(e.target);
			lastMessages = chans[channelIndex].fixed_messages;
			let res = fillContent(chans[channelIndex].inner || lastMessages, users, chans[channelIndex].lastMessageID);
			lastMessageID = res.last;
			chans[channelIndex].inner = res.inner;
			chans[channelIndex].lastMessageID = res.last;
		}
	}
	
	// Make sure we can close the thread bar
	$("closeThread").onmousedown = (e) => {
		toggleThread(false);
	}
	
	
	// User clicked a THREAD! element
	function thread(e){
		toggleThread(true);
		let id = e.parentElement.getAttribute("threadID");
		
		$("threadContent").children[0].innerHTML = "";
		
		let messages = lastMessages[id].replies;
		
		for(var i = 0; i < messages.length; i++){
			$("threadContent").children[0].innerHTML += makeMessage(i, users[messages[i].user], messages[i].ts, messages[i].text);
		}
	}
	
	// User clicked a channel reference
	function changeToChannel(changeTo) {
		if(!changeTo)return;
		let channelIndex = -1;
		changeTo = changeTo.substring(1);
		for(var i = 0; i < chans.length; i++){
			if(chans[i].id == changeTo){
				channelIndex = i;
				break;
			}
		}
		if(channelIndex == -1){
			alert("Couldn't find channel");
			return;
		}
		
		scrollToTop();
		
		toggle($("channelList").children[channelIndex]);
		lastMessages = fixFormatting(chans, users, getMessages(chans[channelIndex]));
		let res = fillContent(lastMessages, users);
		chans[channelIndex].lastMessageID = res.last;
		chans[channelIndex].inner = res.inner;
		lastMessageID = res.last;
	}
	
	$("content").onwheel = (e) => {scrollCheck()};
	$("content").onscroll = (e) => {scrollCheck()};
	
	function scrollCheck(){
		if(channelIndex == -1)return;
		let shouldUpdate = $("content").scrollTop + $("content").clientHeight >= ($("content").children[0].clientHeight / 6) * 5;
		
		if(shouldUpdate){
			if($("channelMessages").children[$("channelMessages").children.length-1].getAttribute("LoadMore") && canUpdate){
				appendContent(lastMessages, users, chans[channelIndex].lastMessageID, (data) => {
					chans[channelIndex].inner = data.inner;
					chans[channelIndex].lastMessageID = data.last;
					canUpdate = false;
				});
			}
		}else{
			canUpdate = true;
		}
	}
	
	
	function scrollToTop(){
		$("content").scrollTop = 0;
	}
}
