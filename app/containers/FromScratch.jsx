import React from 'react';
import Codemirror from 'react-codemirror';
import CodeMirror from '../../node_modules/codemirror/';

require('../../node_modules/codemirror/addon/scroll/simplescrollbars.js');
require('../../node_modules/codemirror/addon/selection/active-line.js');
require('../../node_modules/codemirror/addon/fold/indent-fold.js');
require('../../node_modules/codemirror/addon/fold/foldcode.js');
require('../../node_modules/codemirror/addon/fold/foldgutter.js');

require('../../node_modules/codemirror/addon/search/search.js');
require('../../node_modules/codemirror/addon/search/searchcursor.js');
require('../../node_modules/codemirror/addon/search/jump-to-line.js');
require('../../node_modules/codemirror/addon/search/matchesonscrollbar.js');
require('../../node_modules/codemirror/addon/dialog/dialog.js');

require('../../node_modules/codemirror/keymap/sublime.js');

const electron = require('electron');
const ipc = electron.ipcRenderer;
const remote = electron.remote;
const shell = electron.shell;
const handleContent = remote.getGlobal('handleContent');
const nodeStorage = remote.getGlobal('nodeStorage');

export default class FromScratch extends React.Component {
  static defaultProps = {
    content: '|> Welcome to FromScratch.\n\n\n'
            + 'This app saves everything you type automatically, there\'s no need to save manually.'
            + '\n\nYou can type neat arrows like these: '
            + '->, -->, ->> and =>, courtesy of the font "Fira Code".\n\n'
            + '\tFromScratch also does automatic indenting\n'
            + '\tand more. So delete this text & let\'s go!',
  }

  constructor(props) {
    super();

    this.state = {
      content: handleContent.read() || props.content,
      fontSize: nodeStorage.getItem('fontSize') || 1,
      folds: (() => {
        const foldItem = nodeStorage.getItem('folds');
        return (foldItem && foldItem.folds) ? foldItem.folds : [];
      })(),
      mock: 'nosave',
      update: 'updater'
    };
  }

  componentDidMount() {
    ipc.on('executeShortCut', (event, shortcut) => {
      switch (shortcut) {
        case 'save':
          this.showMockMessage();
          break;
        case 'reset-font':
          this.updateFont(0, true);
          break;
        case 'increase-font':
          this.updateFont(0.1);
          break;
        case 'decrease-font':
          this.updateFont(-0.1);
          break;
        case 'show-update-msg':
          this.showUpdateMessage();
          break;
        default:
          break;
      }
    });

    const cmInstance = this.refs.editor.getCodeMirror();
    this.applyFolds(cmInstance);

    cmInstance.on('fold', () => {
      this.updateFolds();
    });

    cmInstance.on('unfold', () => {
      this.updateFolds();
    });
  }

  componentDidUpdate() {
    ipc.send('writeContent', this.state.content);
    this.updateFolds();
  }

  applyFolds(cm) {
    this.state.folds.forEach((fold) => {
      cm.foldCode(CodeMirror.Pos.apply(this, fold));
    });
  }

  updateFolds() {
    const newFolds = this.refs.editor.getCodeMirror().getAllMarks()
      .filter((mark) => mark.collapsed && mark.type === 'range')
      .reverse()
      .map((mark) => {
        const pos = mark.find().from;
        return [pos.line, pos.ch];
      });

    nodeStorage.setItem('folds', { folds: newFolds });
  }

  showMockMessage() {
    clearTimeout(window.hideSaveMessage);
    this.setState({ mock: 'nosave active' });
    window.hideSaveMessage = setTimeout(() => {
      this.setState({ mock: 'nosave' });
    }, 1000);
  }

  showUpdateMessage() {
    const hideMessageFor = nodeStorage.getItem('hideUpdateMessage');
    const hideVersion = hideMessageFor ? hideMessageFor.version : false;
    const latestVersion = remote.getGlobal('latestVersion');

    if (latestVersion !== hideVersion) {
      this.setState({ update: 'updater active' });
    }
  }

  updateFont(diff, reset) {
    const newFontsize = reset ? 1 : Math.min(Math.max(this.state.fontSize + diff, 0.5), 2.5);
    nodeStorage.setItem('fontSize', newFontsize);
    this.setState({ fontSize: newFontsize });
  }


  handleChange(newcontent) {
    this.setState({ content: newcontent });
  }

  openDownloadPage(e) {
    shell.openExternal('https://fromscratch.rocks');
    this.setState({ update: 'updater' });
  }

  hideUpdateMessage(e) {
    e.stopPropagation();
    const latestVersion = remote.getGlobal('latestVersion');
    nodeStorage.setItem('hideUpdateMessage', { version: latestVersion });
    this.setState({ update: 'updater' });
  }

  render() {
    const style = {
      fontSize: `${this.state.fontSize}rem`
    };
    const latestVersion = remote.getGlobal('latestVersion');
    const extraKeys = {
        'Shift-Tab': 'indentLess',
        'Esc': 'clearSearch',
        'Alt-G': false,
    };

    const CmdOrCtrl = process.platform === "darwin" ? "Cmd-" : "Ctrl-";
    // from sublime.js package
    extraKeys[CmdOrCtrl + "Up"] = 'swapLineUp';
    extraKeys[CmdOrCtrl + "Down"] = 'swapLineDown';
    extraKeys[CmdOrCtrl + "["] = (cm) => { cm.foldCode(cm.getCursor()); };
    extraKeys[CmdOrCtrl + "]"] = (cm) => { cm.foldCode(cm.getCursor()); };
    extraKeys[CmdOrCtrl + "F"] = 'findPersistent';
    extraKeys["Shift-" + CmdOrCtrl + "F"] = 'replace';
    extraKeys["Shift-" + CmdOrCtrl + "R"] = 'replaceAll';
    extraKeys[CmdOrCtrl + "G"] = 'jumpToLine';

    const options = {
      styleActiveLine: true,
      lineNumbers: false,
      lineWrapping: true,
      theme: 'fromscratch',
      autofocus: true,
      scrollbarStyle: 'overlay',
      indentUnit: 4,
      tabSize: 4,
      indentWithTabs: true,
      cursorScrollMargin: 40,
      foldOptions: {
        rangeFinder: CodeMirror.fold.indent,
        scanUp: true,
        widget: ' … ',
      },
      foldGutter: true,
      gutters: ['CodeMirror-foldgutter'],
      extraKeys,
    };
    return (
      <div style={style} data-platform={process.platform}>
        <Codemirror value={this.state.content} ref="editor" onChange={this.handleChange.bind(this)} options={options} />
        <div className={this.state.mock}>Already saved! ;)</div>
        <div onClick={this.openDownloadPage.bind(this)} className={this.state.update}>
          There's an update available! Get version {latestVersion}
          <span title="Don't show this again until next available update" onClick={this.hideUpdateMessage.bind(this)}>
            ×
          </span>
        </div>
        <div className="titlebar"></div>
      </div>
    );
  }
}
