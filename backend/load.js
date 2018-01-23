const fs = require("fs");

let dataExists = false;
let path = __dirname + "/../data";

if(fs.existsSync(path)){
	dataExists = true;
}

function hasData(){
	return dataExists;
}
