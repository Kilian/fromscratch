/* eslint no-path-concat: 0, func-names:0 */
var app = require('app');
var BrowserWindow = require('browser-window');
var fs = require('fs');
var ipc = require('electron').ipcMain;
var menu = require('electron').Menu;
var gsc = require('global-shortcut');
var JSONStorage = require('node-localstorage').JSONStorage;
var shell = require('electron').shell;
var APPVERSION = require('./package.json').version;

if (process.env.NODE_ENV === 'development') {
  require('electron-debug')();
}

// data saving
var storageLocation = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'] + '/.fromscratch';
global.nodeStorage = new JSONStorage(storageLocation);

global.handleContent = {
  filename: storageLocation + '/' + (process.env.NODE_ENV === 'development' ? 'dev' : 'content') + '.txt',
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
  var windowState = {};
  try {
    windowState = global.nodeStorage.getItem('windowstate');
  } catch (err) {
    console.log('empty window state file, creating new one.');
  }

  ipc.on('writeContent', function(event, arg) {
    global.handleContent.write(arg);
  });

  var windowSettings = {
    show: false,
    title: 'FromScratch',
    icon: __dirname + '/app/assets/img/icon.png',
    x: windowState.bounds && windowState.bounds.x || undefined,
    y: windowState.bounds && windowState.bounds.y || undefined,
    width: windowState.bounds && windowState.bounds.width || 550,
    height: windowState.bounds && windowState.bounds.height || 450,
    'dark-theme': true,
    backgroundColor: '#002b36',
    'web-preferences': {
      'overlayScrollbars': true,
    }
  };

  mainWindow = new BrowserWindow(windowSettings);

  // Restore maximised state if it is set. not possible via options so we do it here
  if (windowState.isMaximized) {
    mainWindow.maximize();
  }

  if (process.env.HOT) {
    mainWindow.loadURL('file://' + __dirname + '/app/hot-dev-app.html');
  } else {
    mainWindow.loadURL('file://' + __dirname + '/app/app.html');
  }

  mainWindow.webContents.on('did-finish-load', function() {
    mainWindow.show();
    mainWindow.focus();
  });

  var dispatchShortcutEvent = function(ev) {
    mainWindow.webContents.send('executeShortCut', ev);
  };

  var registerShortcuts = function() {
    gsc.register('CmdOrCtrl+0', function() { dispatchShortcutEvent('reset-font'); } );
    gsc.register('CmdOrCtrl+-', function() { dispatchShortcutEvent('decrease-font'); } );
    gsc.register('CmdOrCtrl+=', function() { dispatchShortcutEvent('increase-font'); } );
    gsc.register('CmdOrCtrl+Plus', function() { dispatchShortcutEvent('increase-font'); } );
    gsc.register('CmdOrCtrl+s', function() { dispatchShortcutEvent('save'); } );
    gsc.register('CmdOrCtrl+w', function() { app.quit(); } );
    gsc.register('CmdOrCtrl+q ', function() { app.quit(); } );
    gsc.register('CmdOrCtrl+r ', function() { } );
  };

  registerShortcuts();

  mainWindow.on('focus', function() {
    registerShortcuts();
  });

  mainWindow.on('blur', function() {
    gsc.unregisterAll();
  });

  var storeWindowState = function() {
    windowState.isMaximized = mainWindow.isMaximized();
    if (!windowState.isMaximized) {
      // only update bounds if the window isn't currently maximized
      windowState.bounds = mainWindow.getBounds();
    }
    global.nodeStorage.setItem('windowstate', windowState);
  };

  ['resize', 'move', 'close'].forEach(function(e) {
    mainWindow.on(e, function() {
      storeWindowState();
    });
  });

  var template = [{
    label: 'FromScratch',
    submenu: [
      {
        label: 'Website',
        click: function() { shell.openExternal('https://fromscratch.rocks'); }
      },
      {
        label: 'Support',
        click: function() { shell.openExternal('https://github.com/Kilian/fromscratch/issues'); }
      },
      {
        label: 'Check for updates (current: ' + APPVERSION + ')',
        click: function() { shell.openExternal('https://github.com/Kilian/fromscratch/releases'); }
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        click: function() { app.quit(); }
      }]
  }];

  if (process.platform === 'darwin') {
    template.push({
      label: 'Edit',
      submenu: [{
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        selector: 'undo:'
      }, {
        label: 'Redo',
        accelerator: 'Shift+CmdOrCtrl+Z',
        selector: 'redo:'
      }, {
        type: 'separator'
      }, {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        selector: 'cut:'
      }, {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        selector: 'copy:'
      }, {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        selector: 'paste:'
      }, {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        selector: 'selectAll:'
      }]
    });
  }

  var menuBar = menu.buildFromTemplate(template);
  menu.setApplicationMenu(menuBar);

  mainWindow.on('closed', function() {
    mainWindow = null;
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.openDevTools();
  }
});
