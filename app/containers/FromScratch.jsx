import React from 'react';
import Codemirror from 'react-codemirror';

require('../../node_modules/react-codemirror/node_modules/codemirror/addon/scroll/simplescrollbars.js');
require('../../node_modules/react-codemirror/node_modules/codemirror/addon/selection/active-line.js');
require('../../node_modules/react-codemirror/node_modules/codemirror/keymap/sublime.js');

const electron = require('electron');
const ipc = electron.ipcRenderer;
const remote = electron.remote;
const handleContent = remote.getGlobal('handleContent');
const nodeStorage = remote.getGlobal('nodeStorage');

export default class FromScratch extends React.Component {
  static defaultProps = {
    content:  '|> Welcome to FromScratch.\n\n\n'
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
      mock: 'nosave',
    }
  }

  componentDidMount() {
    var ref = this;

    ipc.on('executeShortCut', function(event, shortcut) {
      switch (shortcut) {
        case 'save':
          ref.showMockMessage()
          break
        case 'reset-font':
          ref.updateFont(0, true);
          break
        case 'increase-font':
          ref.updateFont(.1);
          break
        case 'decrease-font':
          ref.updateFont(-.1);
          break
      }
    });
  }
  showMockMessage() {
    clearTimeout(window.hideSaveMessage);
    this.setState({mock: 'nosave active'});
    window.hideSaveMessage = setTimeout(() => {
      this.setState({mock: 'nosave'});
    }, 1000)
  }
  updateFont(diff, reset) {
    const newFontsize = reset ? 1 : Math.min(Math.max(this.state.fontSize + diff, .5), 2.5);
    nodeStorage.setItem('fontSize', newFontsize);
    this.setState({fontSize: newFontsize});
  }
  componentDidUpdate() {
    ipc.send('writeContent', this.state.content);
  }

  handleChange(newcontent) {
    this.setState({content: newcontent});
  }

  render() {
    var style = {
      fontSize: this.state.fontSize + "rem"
    }
    var options = {
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
      extraKeys: {
        // from the sublime.js package
        'Ctrl-Up': 'swapLineUp',
        'Ctrl-Down': 'swapLineDown',
        'Shift-Tab': 'indentLess'
      }
    };
    return (
      <div style={style}>
        <Codemirror value={this.state.content} onChange={this.handleChange.bind(this)} options={options} />
        <div className={this.state.mock}>Already saved! ;)</div>
      </div>
    );
  }
}
