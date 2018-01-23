var Session = function(){
	this.lastChannel = 0;
	this.scollLast = 0;
}

Session.prototype.toJson = function(){
	alert("HUI");
}

if(fs.existsSync(__dirname+"/../state.json")){
	let j = fs.readFileSync(__dirname+"/../state.json", {encoding:"utf-8"});
}else{

}
