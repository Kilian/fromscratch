import React, { PureComponent } from 'react';

export default class Shortcuts extends PureComponent {
  render() {
    const classNames = `shortcuts ${this.props.visible ? 'visible' : ''}`;

    return (
      <div className={classNames}>
        <h3>Shortcuts</h3>

        <button title="Close shortcuts" onClick={this.props.toggleShortcutsVisible}>
          ×
        </button>

        <ul>
          <li>
            <span>
              <kbd>cmd/ctrl+up</kbd>
            </span>
            <span>move current line up</span>
          </li>
          <li>
            <span>
              <kbd>cmd/ctrl+down</kbd>
            </span>
            <span>move current line down</span>
          </li>
          <li>
            <span>
              <kbd>cmd/ctrl+d</kbd>
            </span>
            <span>delete current line</span>
          </li>
          <li>
            <span>
              <kbd>cmd/ctrl+w/q</kbd>
            </span>
            <span>close application</span>
          </li>
          <li>
            <span>
              <kbd>cmd/ctrl +/=</kbd>
            </span>
            <span>zoom text in</span>
          </li>
          <li>
            <span>
              <kbd>cmd/ctrl -</kbd>
            </span>
            <span>zoom text out</span>
          </li>
          <li>
            <span>
              <kbd>cmd/ctrl+0</kbd>
            </span>
            <span>reset text size</span>
          </li>
          <li>
            <span>
              <kbd>cmd/ctrl+]/[</kbd>
            </span>
            <span>fold note collapsing</span>
          </li>
          <li>
            <span>
              <kbd>cmd/ctrl+f</kbd>
            </span>
            <span>search (you can also use regular expressions, by starting and ending with a /)</span>
          </li>
          <li>
            <span>
              <kbd>shift+cmd/ctrl+f</kbd>
            </span>
            <span>replace</span>
          </li>
          <li>
            <span>
              <kbd>shift+cmd/ctrl+r</kbd>
            </span>
            <span>replace all</span>
          </li>
          <li>
            <span>
              <kbd>cmd/ctrl+g</kbd>
            </span>
            <span>
              jump to line (you can also use &lt;line&gt;:&lt;character&gt; notation, or go relative lines with
              +&lt;line&gt; and -&lt;line&gt;)
            </span>
          </li>
          <li>
            <span>
              <kbd>cmd/ctrl+/</kbd>
            </span>
            <span>Add or toggle a checkbox</span>
          </li>
          <li>
            <span>
              <kbd>f11</kbd>
            </span>
            <span>Toggle fullscreen</span>
          </li>
          <li>
            <span>
              <kbd>cmd/ctrl+i</kbd>
            </span>
            <span>Toggle between light and dark theme</span>
          </li>
          <li>
            <span>
              <kbd>alt</kbd>
            </span>
            <span>show or hide menu (Windows only)</span>
          </li>
          <li>
            <span>
              <kbd>cmd/ctrl+s</kbd>
            </span>
            <span>...this does nothing.</span>
          </li>
        </ul>
      </div>
    );
  }
}
