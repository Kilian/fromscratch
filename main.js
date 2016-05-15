/* eslint no-path-concat: 0, func-names:0 */
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const fs = require('fs');
const ipc = electron.ipcMain;
const menu = electron.Menu;
const gsc = electron.globalShortcut;
const JSONStorage = require('node-localstorage').JSONStorage;
const shell = electron.shell;
const APPVERSION = require('./package.json').version;

if (process.env.NODE_ENV === 'development') {
  require('electron-debug')();
}

// data saving
const storageLocation = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'] + '/.fromscratch';
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
let mainWindow = null;
app.on('window-all-closed', function() {
  app.quit();
});

app.on('ready', function() {
  let windowState = {};
  try {
    windowState = global.nodeStorage.getItem('windowstate');
  } catch (err) {
    console.log('empty window state file, creating new one.');
  }

  ipc.on('writeContent', function(event, arg) {
    global.handleContent.write(arg);
  });

  const windowSettings = {
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

  mainWindow.loadURL('file://' + __dirname + '/app/app.html');

  mainWindow.webContents.on('did-finish-load', function() {
    mainWindow.show();
    mainWindow.focus();
  });

  const dispatchShortcutEvent = function(ev) {
    mainWindow.webContents.send('executeShortCut', ev);
  };

  const registerShortcuts = function() {
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

  const storeWindowState = function() {
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

  const template = [{
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

  const menuBar = menu.buildFromTemplate(template);
  menu.setApplicationMenu(menuBar);

  mainWindow.on('closed', function() {
    mainWindow = null;
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.openDevTools();
  }
});
