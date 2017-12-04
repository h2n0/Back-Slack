function $(id){
	return document.getElementById(id);
}


let lastChannel = null;
let threadActive = false;

function toggle(channel){
	if(lastChannel){
		lastChannel.classList.remove("active");
	}
	channel.classList.add("active");
	lastChannel = channel;
}

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
	return "<li threadID=" + threadID + ">" + res + "</li>";
}

function fillContent(messages, users){
	$("content").children[0].innerHTML = "";
	
	for(var i = 0; i < messages.length; i++){
		$("content").children[0].innerHTML += makeMessage(i, users[messages[i].user], messages[i].ts, messages[i].text, messages[i].thread?true:false);
	}
}

function fixFormatting(chans, users, msgs){
	for(var i = 0; i < msgs.length; i++){
		let c = msgs[i];
		if(c.replies){
			if(c.replies.length > 0){
				fixFormatting(chans, users, c.replies);
			}
		}
	
		let reg = /(<(.*?)>)/g;
		let parts = c.text.match(reg);
		if(parts){
			for(var j = 0; j < parts.length; j++){
				let cp = parts[j].substring(1, parts[j].length-1);
				if(cp.indexOf("|") != -1){//Chanel reference
					let chanID = cp.substring(0, cp.indexOf("|"));
					let chanText = cp.substring(cp.indexOf("|")+1);
					msgs[i].text = msgs[i].text.replace(parts[j], "<span onclick=changeToChannel('"+chanID+"') class='chanRef'>#"+chanText+"</span>");
				}else if(cp.indexOf("@") != -1){//User mention
					console.log(msgs[i]);
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

if( hasData() ){
	let chans = getChannels();
	let users = getUsers();
	let lastMessages = null;

	// Populate the channel side bar
	for(var i = 0; i < chans.length; i++){
		$("channelList").innerHTML += "<li>"+ chans[i].name +"</li>";
	}
	
	//Add mouse event to it
	$("channelList").onmousedown = (e) => {
	
		if(e.target.nodeName == "LI"){
			let channelIndex = -1;
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
			toggle(e.target);
			lastMessages = fixFormatting(chans, users, getMessages(chans[channelIndex]));
			fillContent(lastMessages, users);
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
		
		$("threadContent").innerHTML = "";
		
		let messages = lastMessages[id].replies;
		
		for(var i = 0; i < messages.length; i++){
			$("threadContent").innerHTML += makeMessage(i, users[messages[i].user], messages[i].ts, messages[i].text);
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
		
		toggle($("channelList").children[channelIndex]);
		lastMessages = fixFormatting(chans, users, getMessages(chans[channelIndex]));
		fillContent(lastMessages, users);
	}
}
