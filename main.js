const electron = require("electron");
const fs = require("fs");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
var mainWindow = null;

app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
    app.quit();
  }
});
app.on('ready', function() {
  mainWindow = new BrowserWindow({width: 1024, height: 600, minWidth: 800});
  
  if(fs.existsSync(__dirname+"/data")){
  	mainWindow.loadURL('file://' + __dirname + '/display/index.html');
  }else{
  	mainWindow.loadURL('file://' + __dirname + '/display/none.html');
  }
  
  
//  mainWindow.webContents.openDevTools();
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});
