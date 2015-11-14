import React from 'react';
import Codemirror from 'react-codemirror';

require('../../node_modules/react-codemirror/node_modules/codemirror/keymap/sublime.js');
var ipc = require('ipc');
var remote = require('remote');
var handleContent = remote.getGlobal('handleContent');

export default class FromScratch extends React.Component {
  static defaultProps = {
    content:  '|> Welcome to FromScratch.\n\n'
            + 'This app saves everything you type automatically, there\'s no need to save.'
            + '\n\nOh, and you can type neat arrows like these: '
            + '->, -->. ->> and =>, courtesy of the font "Fira Code".\n\n'
            + 'FromScratch also does automatic indenting and more. So delete this text and let\'s go!',
  }

  constructor(props) {
    super();
    this.state = {
      content: handleContent.read() || props.content
    }
  }

  componentDidUpdate() {
    ipc.send('writeContent', this.state.content);
  }

  handleChange(newcontent) {
    this.setState({content: newcontent});
  }

  render() {
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
      <Codemirror value={this.state.content} onChange={this.handleChange.bind(this)} options={options} />
    );
  }
}
