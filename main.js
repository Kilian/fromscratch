/* eslint no-path-concat: 0, func-names:0 */
var app = require('app');
var BrowserWindow = require('browser-window');
var fs = require('fs');
var ipc = require('ipc');
var JSONStorage = require('node-localstorage').JSONStorage;

require('electron-debug')();
require('crash-reporter').start();

// data saving
var storageLocation = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'] + '/.fromscratch';
var nodeStorage = new JSONStorage(storageLocation);

global.handleContent = {
  filename: storageLocation + '/content.txt',
  write: function(content) {
    fs.writeFileSync(this.filename, content, 'utf8');
  },
  read: function() {
    return fs.existsSync(this.filename) ? fs.readFileSync(this.filename, 'utf8') : false;
  }
};

// app init
var mainWindow = null;
app.on('window-all-closed', function() {
  app.quit();
});

app.on('ready', function() {
  var windowState = nodeStorage.getItem('windowstate') || {};

  ipc.on('writeContent', function(event, arg) {
    global.handleContent.write(arg);
  });

  var windowSettings = {
    title: 'FromScratch',
    icon: __dirname + '/app/assets/img/icon.png',
    x: windowState.bounds && windowState.bounds.x || undefined,
    y: windowState.bounds && windowState.bounds.y || undefined,
    width: windowState.bounds && windowState.bounds.width || 550,
    height: windowState.bounds && windowState.bounds.height || 450,
    'dark-theme': true,
    'web-preferences': {
      'overlay-scrollbars': true,
    }
  };

  mainWindow = new BrowserWindow(windowSettings);

  // Restore maximised state if it is set. not possible via options so we do it here
  if (windowState.isMaximized) {
    mainWindow.maximize();
  }

  if (process.env.HOT) {
    mainWindow.loadUrl('file://' + __dirname + '/app/hot-dev-app.html');
  } else {
    mainWindow.loadUrl('file://' + __dirname + '/app/app.html');
  }

  var storeWindowState = function() {
    windowState.isMaximized = mainWindow.isMaximized();
    if (!windowState.isMaximized) {
      // only update bounds if the window isn't currently maximized
      windowState.bounds = mainWindow.getBounds();
    }
    nodeStorage.setItem('windowstate', windowState);
  };

  ['resize', 'move', 'close'].forEach(function(e) {
    mainWindow.on(e, function() {
      storeWindowState();
    });
  });


  mainWindow.on('closed', function() {
    mainWindow = null;
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.openDevTools();
  }
});
