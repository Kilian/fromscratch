/* eslint no-path-concat: 0, func-names:0 */
import fs from 'fs';
import path from 'path';
import https from 'https';
import electron from 'electron';
import { JSONStorage } from 'node-localstorage';
import compareVersions from 'compare-versions';
import minimist from 'minimist';

const APPVERSION = require('./package.json').version;

const { app, BrowserWindow, ipcMain: ipc, Menu: menu, globalShortcut: gsc, shell } = electron;
const isDev = process.env.NODE_ENV === 'development';
let mainWindow = null;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  if (isDev) {
    require('electron-debug')(); // eslint-disable-line global-require
  }

  const argv = minimist(process.argv.slice(isDev ? 2 : 1), {
    boolean: ['help'],
    string: ['portable'],
    alias: {
      help: 'h',
    },
  });

  if (argv.help) {
    console.log(`Usage: fromscratch [OPTION]...

Optional arguments:
  --portable [DIRECTORY] run in portable mode, saving data in executable directory, or in alternate path
  -h, --help                 show this usage text.
  `);

    process.exit(0);
  }

  // get data location
  const getDataLocation = () => {
    let location = `${process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME']}/.fromscratch${
      isDev ? '/dev' : ''
    }`;

    if (typeof argv.portable !== 'undefined') {
      location = argv.portable !== '' ? argv.portable : `${process.cwd()}/userdata`;
      app.setPath('userData', location);
    }

    return location;
  };

  const storageLocation = getDataLocation();

  global.nodeStorage = new JSONStorage(storageLocation);

  global.handleContent = {
    filename: `${storageLocation}/content.txt`,
    write(content) {
      fs.writeFileSync(this.filename, content, 'utf8');
    },
    read() {
      return fs.existsSync(this.filename) ? fs.readFileSync(this.filename, 'utf8') : false;
    },
  };

  const installExtensions = () => {
    if (isDev) {
      const installer = require('electron-devtools-installer'); // eslint-disable-line global-require
      const extensions = ['REACT_DEVELOPER_TOOLS'];
      const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
      extensions.forEach(name => {
        try {
          installer.default(installer[name], forceDownload);
        } catch (e) {} // eslint-disable-line
      });
    }
  };

  // app init
  app.on('window-all-closed', () => {
    app.quit();
  });

  app.on('ready', () => {
    installExtensions();

    let windowState = {};
    try {
      windowState = global.nodeStorage.getItem('windowstate') || {};
    } catch (err) {
      console.log('empty window state file, creating new one.');
    }

    ipc.on('writeContent', (event, arg) => {
      global.handleContent.write(arg);
    });

    const currentLightTheme = global.nodeStorage.getItem('lightTheme') || false;

    const windowSettings = {
      show: false,
      title: app.getName(),
      icon: path.join(__dirname, './assets/img/icon.png'),
      x: (windowState.bounds && windowState.bounds.x) || undefined,
      y: (windowState.bounds && windowState.bounds.y) || undefined,
      width: (windowState.bounds && windowState.bounds.width) || 550,
      height: (windowState.bounds && windowState.bounds.height) || 450,
      darkTheme: true,
      titleBarStyle: 'hidden',
      autoHideMenuBar: true,
      transparent:  process.platform === 'darwin',
      webPreferences: {
        blinkFeatures: 'OverlayScrollbars',
        nodeIntegration: true,
      },
    };

    if (process.platform === 'darwin') {
      ipc.on('setVibrancy', (event, lightTheme) => {
        mainWindow.setVibrancy(lightTheme ? 'medium-light' : 'ultra-dark');
      });
      windowSettings.backgroundColor = currentLightTheme ? '#00ffffff' : '#00002b36';
    } else {
      windowSettings.backgroundColor = '#002b36';
    }

    mainWindow = new BrowserWindow(windowSettings);
    mainWindow.loadURL(`file://${__dirname}/app.html`);

    mainWindow.on('ready-to-show', () => {
      mainWindow.setVibrancy(currentLightTheme ? 'medium-light' : 'ultra-dark');
      mainWindow.show();
      // Restore maximised state if it is set. not possible via options so we do it here
      if (windowState.isMaximized) {
        mainWindow.maximize();
      }
      mainWindow.focus();
      checkForUpdates();
    });

    const toggleFullscreen = () => {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    };

    const exitFullScreen = () => {
      if (mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false);
      }
    };

    const dispatchShortcutEvent = ev => {
      mainWindow.webContents.send('executeShortCut', ev);
    };

    mainWindow.webContents.setVisualZoomLevelLimits(1, 1);

    const registerShortcuts = () => {
      gsc.register('CmdOrCtrl+0', () => {
        dispatchShortcutEvent('reset-font');
      });
      gsc.register('CmdOrCtrl+-', () => {
        dispatchShortcutEvent('decrease-font');
      });
      gsc.register('CmdOrCtrl+=', () => {
        dispatchShortcutEvent('increase-font');
      });
      gsc.register('CmdOrCtrl+Plus', () => {
        dispatchShortcutEvent('increase-font');
      });
      gsc.register('CmdOrCtrl+i', () => {
        dispatchShortcutEvent('toggle-theme');
      });
      gsc.register('CmdOrCtrl+s', () => {
        dispatchShortcutEvent('save');
      });
      gsc.register('CmdOrCtrl+w', () => {
        app.quit();
      });
      if ( process.platform !== 'darwin' ) {
        gsc.register('CmdOrCtrl+q ', () => {
          app.quit();
        });
      }
      gsc.register('CmdOrCtrl+r ', () => {});
      gsc.register('f11', () => {
        toggleFullscreen();
      });
      gsc.register('esc', () => {
        exitFullScreen();
      });
      gsc.register('f1', () => {
        dispatchShortcutEvent('toggle-shortcuts');
      });
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
      global.nodeStorage.setItem('windowstate', windowState);
    };

    ['resize', 'move', 'close'].forEach(e => {
      mainWindow.on(e, () => {
        storeWindowState();
      });
    });

    const checkForUpdates = () => {
      https
        .get(`https://fromscratch.rocks/latest.json?current=${APPVERSION}`, res => {
          let json = '';
          res.on('data', d => {
            json += d;
          });

          res.on('end', () => {
            const latestVersion = JSON.parse(json).version;
            if (compareVersions(latestVersion, APPVERSION) === 1) {
              global.latestVersion = latestVersion;
              dispatchShortcutEvent('show-update-msg');
            }
          });
        })
        .on('error', e => {
          console.error(e);
        });
    };

    let template = [
      {
        label: app.getName(),
        submenu: [
          {
            label: 'Website',
            click() {
              shell.openExternal('https://fromscratch.rocks');
            },
          },
          {
            label: 'Support',
            click() {
              shell.openExternal('https://github.com/Kilian/fromscratch/issues');
            },
          },
          {
            label: `Check for updates (current: ${APPVERSION})`,
            click() {
              shell.openExternal('https://github.com/Kilian/fromscratch/releases');
            },
          },
          {
            type: 'separator',
          },
          {
            label: 'Quit',
            accelerator: 'CmdOrCtrl+Q',
            click() {
              app.quit();
            },
          },
        ],
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'Toggle theme',
            accelerator: 'CmdOrCtrl+i',
            click() {
              dispatchShortcutEvent('toggle-theme');
            },
          },
          {
            type: 'separator',
          },
          {
            label: 'Increase font size',
            accelerator: 'CmdorCtrl+Plus',
            click() {
              dispatchShortcutEvent('increase-font');
            },
          },
          {
            label: 'Decrease font size',
            accelerator: 'CmdorCtrl+-',
            click() {
              dispatchShortcutEvent('decrease-font');
            },
          },
          {
            label: 'Reset Font size',
            accelerator: 'CmdorCtrl+0',
            click() {
              dispatchShortcutEvent('reset-font');
            },
          },
          {
            type: 'separator',
          },
          {
            label: 'Toggle fullscreen',
            accelerator: 'f11',
            click() {
              toggleFullscreen();
            },
          },
          {
            label: 'Show all shortcuts',
            accelerator: 'f1',
            click() {
              dispatchShortcutEvent('toggle-shortcuts');
            },
          },
        ],
      },
    ];

    if (process.platform === 'darwin') {
      template = [
        {
          label: app.getName(),
          submenu: [
            {
              label: `About ${app.getName()}`,
              click() {
                shell.openExternal('https://fromscratch.rocks');
              },
            },
            {
              label: 'Support',
              click() {
                shell.openExternal('https://github.com/Kilian/fromscratch/issues');
              },
            },
            {
              label: `Check for updates (current: ${APPVERSION})`,
              click() {
                shell.openExternal('https://github.com/Kilian/fromscratch/releases');
              },
            },
            {
              type: 'separator',
            },
            {
              label: `Hide ${app.getName()}`,
              accelerator: 'Command+H',
              role: 'hide',
            },
            {
              label: 'Hide Others',
              accelerator: 'Command+Alt+H',
              role: 'hideothers',
            },
            {
              label: 'Show All',
              role: 'unhide',
            },
            {
              type: 'separator',
            },
            {
              label: 'Quit',
              accelerator: 'Command+Q',
              click() {
                app.quit();
              },
            },
          ],
        },
        {
          label: 'Edit',
          submenu: [
            {
              label: 'Undo',
              accelerator: 'CmdOrCtrl+z',
              selector: 'undo:',
            },
            {
              label: 'Redo',
              accelerator: 'Shift+CmdOrCtrl+z',
              selector: 'redo:',
            },
            {
              type: 'separator',
            },
            {
              label: 'Cut',
              accelerator: 'CmdOrCtrl+x',
              selector: 'cut:',
            },
            {
              label: 'Copy',
              accelerator: 'CmdOrCtrl+c',
              selector: 'copy:',
            },
            {
              label: 'Paste',
              accelerator: 'CmdOrCtrl+v',
              selector: 'paste:',
            },
            {
              label: 'Select All',
              accelerator: 'CmdOrCtrl+a',
              selector: 'selectAll:',
            },
          ],
        },
        {
          label: 'View',
          submenu: [
            {
              label: 'Toggle theme',
              accelerator: 'CmdOrCtrl+i',
              click() {
                dispatchShortcutEvent('toggle-theme');
              },
            },
            {
              type: 'separator',
            },
            {
              label: 'Increase font size',
              accelerator: 'CmdorCtrl+Plus',
              click() {
                dispatchShortcutEvent('increase-font');
              },
            },
            {
              label: 'Decrease font size',
              accelerator: 'CmdorCtrl+-',
              click() {
                dispatchShortcutEvent('decrease-font');
              },
            },
            {
              label: 'Reset Font size',
              accelerator: 'CmdorCtrl+0',
              click() {
                dispatchShortcutEvent('reset-font');
              },
            },
            {
              type: 'separator',
            },
            {
              label: 'Toggle fullscreen',
              accelerator: 'f11',
              click() {
                toggleFullscreen();
              },
            },
            {
              label: 'Show all shortcuts',
              accelerator: 'f1',
              click() {
                dispatchShortcutEvent('toggle-shortcuts');
              },
            },
          ],
        },
      ];
    }

    const menuBar = menu.buildFromTemplate(template);
    menu.setApplicationMenu(menuBar);

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    if (isDev) {
      mainWindow.openDevTools();
    }
  });
}
