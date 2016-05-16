import React from 'react';
import Codemirror from 'react-codemirror';
import CodeMirror from '../../node_modules/react-codemirror/node_modules/codemirror/';

require('../../node_modules/react-codemirror/node_modules/codemirror/addon/scroll/simplescrollbars.js');
require('../../node_modules/react-codemirror/node_modules/codemirror/addon/selection/active-line.js');
require('../../node_modules/react-codemirror/node_modules/codemirror/addon/fold/indent-fold.js');
require('../../node_modules/react-codemirror/node_modules/codemirror/addon/fold/foldcode.js');
require('../../node_modules/react-codemirror/node_modules/codemirror/addon/fold/foldgutter.js');
require('../../node_modules/react-codemirror/node_modules/codemirror/keymap/sublime.js');

const electron = require('electron');
const ipc = electron.ipcRenderer;
const remote = electron.remote;
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
      folds: function () {
        var foldItem = nodeStorage.getItem('folds');
        return (foldItem && foldItem.folds) ? foldItem.folds : [];
      }(),
      mock: 'nosave',
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
        default:
          break;
      }
    });

    const cm = this.refs.editor.getCodeMirror();
    this.applyFolds(cm);
    cm.on("fold", (cm, from) => {
      const newFolds = this.state.folds.concat([[from.line, from.ch]]);
      this.updateFolds(newFolds);
    });

    cm.on("unfold", (cm, from) => {
      this.updateFolds(this.state.folds.filter((fold) => {
        return fold[0] !== from.line && fold[1] !== from.ch;
      }));
    });
  }

  applyFolds(cm) {
    this.state.folds.forEach((fold) => {
      cm.foldCode(CodeMirror.Pos.apply(this, fold));
    })
  }

  updateFolds(newFolds) {
    nodeStorage.setItem('folds', {folds:newFolds});
    this.setState({
      "folds": newFolds
    });
  }

  componentDidUpdate() {
    ipc.send('writeContent', this.state.content);
  }

  showMockMessage() {
    clearTimeout(window.hideSaveMessage);
    this.setState({ mock: 'nosave active' });
    window.hideSaveMessage = setTimeout(() => {
      this.setState({ mock: 'nosave' });
    }, 1000);
  }
  updateFont(diff, reset) {
    const newFontsize = reset ? 1 : Math.min(Math.max(this.state.fontSize + diff, 0.5), 2.5);
    nodeStorage.setItem('fontSize', newFontsize);
    this.setState({ fontSize: newFontsize });
  }


  handleChange(newcontent) {
    this.setState({ content: newcontent });
  }

  render() {
    const style = {
      fontSize: `${this.state.fontSize}rem`
    };

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
        widget: " … ",
      },
      foldGutter: true,
      gutters: ["CodeMirror-foldgutter"],
      extraKeys: {
        // from the sublime.js package
        'Ctrl-Up': 'swapLineUp',
        'Ctrl-Down': 'swapLineDown',
        'Shift-Tab': 'indentLess',
        'Ctrl-Alt-[': function(cm) {cm.foldCode(cm.getCursor());},
        'Ctrl-Alt-]': function(cm) {cm.foldCode(cm.getCursor());}
      }
    };
    return (
      <div style={style}>
        <Codemirror value={this.state.content} ref="editor" onChange={this.handleChange.bind(this)} options={options} />
        <div className={this.state.mock}>Already saved! ;)</div>
      </div>
    );
  }
}
