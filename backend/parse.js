function getChannels(){
	let j = fs.readFileSync(path+"/channels.json", {encoding:"utf-8"});
	let chan = JSON.parse(j);
	return chan;
}

function getUsers(){	
	let j = fs.readFileSync(path+"/users.json", {encoding:"utf-8"});
	let users = JSON.parse(j);
	
	let result = {};
	for(var i = 0; i < users.length; i++){
		result[""+users[i].id] = users[i].profile.display_name || users[i].profile.real_name_normalized;
	}
	return result;
}

function sortReplies(messages){
	let sorted = [];
	let parent = null;
	for(var i = 0; i < messages.length; i++){
		let c = messages[i];
		
		if(c.thread){
			if(parent != null){
				for(var j = i; j < messages.length; j++){
					if(messages[j].threadTs){
						if(messages[j].threadTs == parent.threadTs){
							parent.replies.push(messages.splice(j,1)[0]);
							if(parent.replies.length == parent.replyCount){
								parent = null;
								break;
							}
						}
					}
				}
			}else{
				parent = c;
				sorted.push(parent);
			}
		}else{
			sorted.push(c);
		}
	}
	return sorted;
}

function getMessages(channel){
	let files = fs.readdirSync(path+"/"+channel.name+"/"); // For now we only have one file
	let messages = [];
	for(var i = 0; i < files.length; i++){
		let js = fs.readFileSync(path+"/"+channel.name+"/"+files[i], {encoding:"utf-8"});
		let msgs = JSON.parse(js);
		for(var j = 0; j < msgs.length; j++){
			
			if(msgs[j].hidden){
				if(msgs[j].hidden)continue;
			}
			
			let thread = false;
			
			if(msgs[j].reply_count || msgs[j].thread_ts){
				thread = true;
			}
		
			if (!msgs[j].subtype){
				if(thread){
					messages.push({user: msgs[j].user, text: msgs[j].text, ts: msgs[j].ts, user: msgs[j].user, thread: true, threadTs: msgs[j].thread_ts, replies: [], replyCount: msgs[j].reply_count, parentID: msgs[j].parent_user_id});
				}else{
					messages.push({user: msgs[j].user, text: msgs[j].text, ts: msgs[j].ts, user: msgs[j].user, threadTs: null});
				}
			}
		}
	}
	return sortReplies(messages);
}
