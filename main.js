/* eslint no-path-concat: 0, func-names:0 */
const electron = require('electron');
const fs = require('fs-extra');
const path = require('path');
const dirTree = require('directory-tree');
const JSONStorage = require('node-localstorage').JSONStorage;
const APPVERSION = require('./package.json').version;
const https = require('https');
const compareVersions = require('compare-versions');
const minimist = require('minimist');

const { app, BrowserWindow, ipcMain: ipc, Menu: menu, globalShortcut: gsc, shell } = electron;

if (process.env.NODE_ENV === 'development') {
  require('electron-debug')(); // eslint-disable-line global-require
}

// common util
global.utils = {
  addClass(list, name){
    list.push(name);
    return list;
  },
  removeClass(list, name){
    let i = list.indexOf(name);
    if(i > -1) list.splice(i, 1);
    return list;
  },
};

// data saving
const storageLocation = path.join(
  process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'],
  '.fromscratch',
  (process.env.NODE_ENV === 'development' ? 'dev' : '')
);

global.rootNodeStorage = new JSONStorage(storageLocation);
global.nodeStorage = new JSONStorage(storageLocation);

// a set of data structures and methods related to management of projects/scratches directory hierarchy
global.projects = {
  default: { project: '', scratch: 'Default', path: ''},
  current: { project: '', scratch: '', path: '', },
  tree: {
    // project-name: [
    //   'scratch-name',
    //   ...
    // ],
    // another-project-name: [...]
  },
  openProjects: {
    // project-name: true/false,
  },
  refreshProjectsTree(){ // load directory tree from local storage
    let rootPath = path.join(storageLocation, 'projects');
    if(!fs.existsSync(rootPath)) fs.mkdirSync(rootPath);

    let projectsRaw = dirTree(storageLocation).children.filter(f => f.name === 'projects').shift().children.filter(f => f.type === 'directory');

    this.tree = projectsRaw.reduce((prev, curr, i, arr) => {
      let projectName = curr.name;
      let scratches = curr.children.map(data => data.name);
      prev[projectName] = scratches;
      return prev;
    }, {});
  },
  setCurrentScratch(data, reset){
    this.current = reset ? this.default : {
      path: path.join('projects', data.project, data.scratch),
      scratch: data.scratch,
      project: data.project
    };
    global.rootNodeStorage.setItem('current', this.current);
    global.handleContent.filename = path.join(storageLocation, this.current.path, 'content.txt');
    global.nodeStorage = new JSONStorage(path.join(storageLocation, this.current.path));

    if(!global.handleContent.read())
      global.handleContent.write(
        !reset
        ? 'Scratch for ' + data.project + ': ' + data.scratch
        : 'Default workspace'
      );
  },
  retrieveSavedState(){
    this.openProjects = global.rootNodeStorage.getItem('openProjects') || {};

    let data = global.rootNodeStorage.getItem('current');
    this.current = data ? data : this.default;

    let scratchPath = path.join(storageLocation, this.current.path);
    global.nodeStorage = new JSONStorage(scratchPath);
    return path.join(scratchPath, 'content.txt');
  },
  createProject(project){
    if(project === '') throw 'A new project has to have a valid name.';
    let projectPath = path.join(storageLocation, 'projects', project);
    fs.mkdirSync(projectPath);
  },
  createScratch(project, scratch){
    if(project==='' || scratch==='') throw 'Both project and scratch names are needed to create new scratch.';
    let scratchPath = path.join(storageLocation, 'projects', project, scratch);
    fs.mkdirSync(scratchPath);
  },
  removeProject(project){
    if(project === '') throw 'To remove a project, the name has to be specified';
    let path = storageLocation + '/projects/' + project;
    fs.removeSync(path);
    if(this.current.indexOf(project)>-1)
      this.setCurrentScratch({project: 'default', scratch: 'default_scratch'}, true);
  },
  removeScratch(project, scratch){
    if(project==='' || scratch==='') throw 'To remove a scratch, the name and containing project have to be specified';
    let path = storageLocation + '/projects/' + project + '/' + scratch;
    fs.removeSync(path);
    if(this.current.indexOf(project)>-1 && this.current.indexOf(scratch)>-1)
      this.setCurrentScratch({project: 'default', scratch: 'default_scratch'}, true);
  },
  renameProject(project, newName){
    if(project==='' || newName==='' || project===newName) throw 'New project name has to be non empty and different than the current one.'
    let path = storageLocation + '/projects/';
    fs.renameSync(path + project, path + newName)
  },
  renameScratch(project, scratch, newName){
    if(project==='' || scratch==='' || newName==='' || scratch===newName) throw 'New scratch name has to be non empty and different than the current one.'
    let path = storageLocation + '/projects/' + project + '/';
    fs.renameSync(path + scratch, path + newName);
  },
}

const argv = minimist(process.argv.slice(process.env.NODE_ENV === 'development' ? 2 : 1), {
  boolean: ['help'],
  string: ['portable'],
  alias: {
    help: 'h',
    portable: 'p',
  },
});

if (argv.help) {
  console.log(`Usage: fromscratch [OPTION]...

Optional arguments:
  -p, --portable [DIRECTORY] run in portable mode, saving data in executable directory, or in alternate path
  -h, --help                 show this usage text.
  `);

  process.exit(0);
}

// get data location
const getDataLocation = () => {
  let location = process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME']
    + '/.fromscratch'
    + (process.env.NODE_ENV === 'development' ? '/dev' : '');

  if (typeof argv.portable !== 'undefined') {
    location = argv.portable !== '' ? argv.portable : process.cwd() + '/userdata';
    app.setPath('userData', location);
  }

  return location;
};

const storageLocation = getDataLocation();

global.nodeStorage = new JSONStorage(storageLocation);

// ---------------------------------------------------------------------------------------------------- Folder tree
global.projects = {
  // current: 'projects/project-name/scratch-name',
  default: '',
  current: undefined,
  tree: {
    // project-name: [
    //   'scratch-name',
    //   ...
    // ],
    // another-project-name: [...]
  },
  refreshProjectsTree(){ // load directory tree from local storage
    let projectsRaw = dirTree(storageLocation).children.filter(f => f.name === 'projects').shift().children.filter(f => f.type === 'directory');

    this.tree = projectsRaw.reduce((prev, curr, i, arr) => {
      let projectName = curr.name;
      let scratches = curr.children.map(data => data.name);
      prev[projectName] = scratches;
      return prev;
    }, {});
  },
  setCurrentScratch(data, reset){
    this.current = !reset ? 'projects/' + data.project + '/' + data.scratch : this.default;
    global.handleContent.filename = storageLocation + '/' + this.current + '/content.txt';
    global.nodeStorage = new JSONStorage(storageLocation + '/' + this.current);
    if(!global.handleContent.read())
      global.handleContent.write('Scratch for ' + data.project + ': ' + data.scratch)
  },
  createProject(project){
    if(project === '') throw 'A new project has to have a valid name.';
    let path = storageLocation + '/projects/' + project;
    fs.mkdirSync(path);
  },
  createScratch(project, scratch){
    if(project==='' || scratch==='') throw 'Both project and scratch names are needed to create new scratch.';
    let path = storageLocation + '/projects/' + project + '/' + scratch;
    fs.mkdirSync(path);
  },
  removeProject(project){
    if(project === '') throw 'To remove a project, the name has to be specified';
    let path = storageLocation + '/projects/' + project;
    fs.removeSync(path);
    if(this.current.project === project)
      this.setCurrentScratch(undefined, true);
  },
  removeScratch(project, scratch){
    if(project==='' || scratch==='') throw 'To remove a scratch, the name and containing project have to be specified';
    let scratchPath = path.join(storageLocation, 'projects', project, scratch);
    fs.removeSync(scratchPath);
    if(this.current.project===project && this.current.scratch===scratch)
      this.setCurrentScratch(undefined, true);
  },
  renameProject(project, newName){
    if(project==='' || newName==='' || project===newName) throw 'New project name has to be non empty and different than the current one.'
    let rootPath = path.join(storageLocation, 'projects');
    fs.renameSync(path.join(rootPath, project), path.join(rootPath, newName));
    this.markProjectOpenness(project, false);
    if(this.current.project===project)
      this.setCurrentScratch(undefined, true);
  },
  renameScratch(project, scratch, newName){
    if(project==='' || scratch==='' || newName==='' || scratch===newName) throw 'New scratch name has to be non empty and different than the current one.'
    let rootPath = path.join(storageLocation, 'projects', project);
    fs.renameSync(path.join(rootPath, scratch), path.join(rootPath, newName));
    if(this.current.project===project && this.current.scratch===scratch)
      this.setCurrentScratch(undefined, true);
  },
  markProjectOpenness(project, open){
    if(open)
      this.openProjects[project] = true;
    else
      delete this.openProjects[project];
    global.rootNodeStorage.setItem('openProjects', this.openProjects);
  }
}

global.handleContent = {
  filename: global.projects.retrieveSavedState(),
  write(content) {
    fs.writeFileSync(this.filename, content, 'utf8');
  },
  read() {
    return fs.existsSync(this.filename) ? fs.readFileSync(this.filename, 'utf8') : false;
  }
};

// simple pub-sub mechanizm
global.signalEmitter = {
  _events: {
    // eventName: [callback1, callback2, ...],
    // ...
  },
  dispatch(event, data){
    if(!this._events[event]) return; // no one is listening to this ev
    for (var i = 0; i < this._events[event].length; i++)
      this._events[event][i](data);
  },
  subscribe(event, callback){
    if(!this._events[event]) this._events[event] = []; // new ev
    this._events[event].push(callback);
  },
  unsubscribe(event, callback){
    if(!this._events[event]) return; // can't unsubscribe from not existing ev
    for(var i = 0; i < this._events[event].length; i++)
      if(this._events[event][i] === callback)
        this._events[event].splice(i, 1);
  }
};

const installExtensions = () => {
  if (process.env.NODE_ENV === 'development') {
    const installer = require('electron-devtools-installer'); // eslint-disable-line global-require
    const extensions = [
      'REACT_DEVELOPER_TOOLS'
    ];
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    for (const name of extensions) {
      try {
        installer.default(installer[name], forceDownload);
      } catch (e) {} // eslint-disable-line
    }
  }
};

// app init
let mainWindow = null;
app.on('window-all-closed', () => {
  app.quit();
});

app.on('ready', () => {
  installExtensions();

  let windowState = {};
  try {
    windowState = global.rootNodeStorage.getItem('windowstate') || {};
  } catch (err) {
    console.log('empty window state file, creating new one.');
  }

  ipc.on('writeContent', (event, arg) => {
    global.handleContent.write(arg);
  });

  const windowSettings = {
    show: false,
    title: app.getName(),
    icon: __dirname + '/app/assets/img/icon.png',
    x: (windowState.bounds && windowState.bounds.x) || undefined,
    y: (windowState.bounds && windowState.bounds.y) || undefined,
    width: (windowState.bounds && windowState.bounds.width) || 550,
    height: (windowState.bounds && windowState.bounds.height) || 450,
    darkTheme: true,
    backgroundColor: '#002b36',
    titleBarStyle: 'hidden',
    autoHideMenuBar: true
  };

  mainWindow = new BrowserWindow(windowSettings);
  mainWindow.loadURL('file://' + __dirname + '/app/app.html');

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
    // Restore maximised state if it is set. not possible via options so we do it here
    if (windowState.isMaximized) {
      mainWindow.maximize();
    }
    mainWindow.focus();
    checkForUpdates();
  });

  const dispatchShortcutEvent = (ev) => {
    mainWindow.webContents.send('executeShortCut', ev);
  };

  const registerShortcuts = () => {
    gsc.register('CmdOrCtrl+0', () => { dispatchShortcutEvent('reset-font'); });
    gsc.register('CmdOrCtrl+-', () => { dispatchShortcutEvent('decrease-font'); });
    gsc.register('CmdOrCtrl+=', () => { dispatchShortcutEvent('increase-font'); });
    gsc.register('CmdOrCtrl+Plus', () => { dispatchShortcutEvent('increase-font'); });
    gsc.register('CmdOrCtrl+i', () => { dispatchShortcutEvent('toggle-theme'); });
    gsc.register('CmdOrCtrl+s', () => { dispatchShortcutEvent('save'); });
    gsc.register('CmdOrCtrl+w', () => { app.quit(); });
    gsc.register('CmdOrCtrl+q ', () => { app.quit(); });
    gsc.register('CmdOrCtrl+r ', () => { });
    gsc.register('f11', () => { mainWindow.setFullScreen(!mainWindow.isFullScreen()); });
  };

  registerShortcuts();

  mainWindow.on('focus', () => {
    registerShortcuts();
  });

  mainWindow.on('blur', () => {
    gsc.unregisterAll();
  });

  const storeWindowState = () => {
    windowState.isMaximized = mainWindow.isMaximized();
    if (!windowState.isMaximized) {
      // only update bounds if the window isn't currently maximized
      windowState.bounds = mainWindow.getBounds();
    }
    global.rootNodeStorage.setItem('windowstate', windowState);
  };

  ['resize', 'move', 'close'].forEach((e) => {
    mainWindow.on(e, () => {
      storeWindowState();
    });
  });

  const checkForUpdates = () => {
    https.get('https://fromscratch.rocks/latest.json?current=' + APPVERSION, (res) => {
      let json = '';
      res.on('data', (d) => {
        json += d;
      });

      res.on('end', () => {
        const latestVersion = JSON.parse(json).version;
        if (compareVersions(latestVersion, APPVERSION) === 1) {
          global.latestVersion = latestVersion;
          dispatchShortcutEvent('show-update-msg');
        }
      });
    }).on('error', (e) => {
      console.error(e);
    });
  };

  let template = [{
    label: app.getName(),
    submenu: [
      {
        label: 'Website',
        click() { shell.openExternal('https://fromscratch.rocks'); }
      },
      {
        label: 'Support',
        click() { shell.openExternal('https://github.com/Kilian/fromscratch/issues'); }
      },
      {
        label: 'Check for updates (current: ' + APPVERSION + ')',
        click() { shell.openExternal('https://github.com/Kilian/fromscratch/releases'); }
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        click() { app.quit(); }
      }]
  }];

  if (process.platform === 'darwin') {
    template = [{
      label: app.getName(),
      submenu: [
        {
          label: 'About ' + app.getName(),
          click() { shell.openExternal('https://fromscratch.rocks'); }
        },
        {
          label: 'Support',
          click() { shell.openExternal('https://github.com/Kilian/fromscratch/issues'); }
        },
        {
          label: 'Check for updates (current: ' + APPVERSION + ')',
          click() { shell.openExternal('https://github.com/Kilian/fromscratch/releases'); }
        },
        {
          type: 'separator'
        },
        {
          label: 'Hide ' + app.getName(),
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Alt+H',
          role: 'hideothers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click() { app.quit(); }
        }
      ]
    }, {
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
    }];
  }

  const menuBar = menu.buildFromTemplate(template);
  menu.setApplicationMenu(menuBar);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.openDevTools();
  }

});
