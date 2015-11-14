import React from 'react';
import Codemirror from 'react-codemirror';

require('../../node_modules/react-codemirror/node_modules/codemirror/keymap/sublime.js');
var ipc = require('ipc');
var remote = require('remote');
var handleContent = remote.getGlobal('handleContent');
var nodeStorage = remote.getGlobal('nodeStorage');

export default class FromScratch extends React.Component {
  static defaultProps = {
    content:  '|> Welcome to FromScratch.\n\n\n'
            + 'This app saves everything you type automatically, there\'s no need to save manually.'
            + '\n\nYou can type neat arrows like these: '
            + '->, -->, ->> and =>, courtesy of the font "Fira Code".\n\n'
            + '\tFromScratch also does automatic indenting'
            + '\tand more. So delete this text & let\'s go!',
  }

  constructor(props) {
    super();
    this.state = {
      content: handleContent.read() || props.content,
      fontSize: nodeStorage.getItem('fontSize') || 1
    }
  }

  componentDidMount() {
    var ref = this;
    window.executeShortCut = function(shortcut) {
      switch (shortcut) {
        case 'save':
          ref.showMockMessage()
          break
        case 'increase-font':
          ref.updateFont(.1);
          break
        case 'decrease-font':
          ref.updateFont(-.1);
          break
      }
    }
  }
  showMockMessage() {
    console.log("no need to save!");
  }
  updateFont(diff) {
    const newFontsize = Math.min(Math.max(this.state.fontSize + diff, .5), 2.5);
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
      mode: 'text',
      lineNumbers: false,
      lineWrapping: true,
      theme: 'fromscratch',
      autofocus: true,
      scrollbarStyle: null,
      extraKeys: {
        // from the sublime.js package
        'Ctrl-Up': 'swapLineUp',
        'Ctrl-Down': 'swapLineDown'
      }
    };
    return (
      <div style={style}>
        <Codemirror value={this.state.content} onChange={this.handleChange.bind(this)} options={options} />
      </div>
    );
  }
}
