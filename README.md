<img src="https://fromscratch.rocks/assets/img/icon.png?">

FromScratch
===========

## A simple but smart note-taking app

FromScratch is a little app that you can use as a quick note taking or todo app.</p>

* Small and simple, the only UI is the text you type
* Saves on-the-fly, no need to manually save
* Automatic indenting
* Note-folding
* Use checkboxes to keep track of your TODO's
* Powerful keyboard control
* Replaces common syntax with symbols, such as arrows
* Free


### Shortcuts

* <kbd>cmd/ctrl+up</kbd> - move current line up
* <kbd>cmd/ctrl+down</kbd> - move current line down
* <kbd>cmd/ctrl+d</kbd> - delete current line
* <kbd>cmd/ctrl+w/q</kbd> - close application
* <kbd>cmd/ctrl +/=</kbd> - zoom text in
* <kbd>cmd/ctrl -</kbd> - zoom text out
* <kbd>cmd/ctrl+0</kbd> - reset text size
* <kbd>cmd/ctrl+]/[</kbd> - fold note collapsing
* <kbd>cmd/ctrl+f</kbd> - search (you can also use regular expressions, by starting and ending with a /)
* <kbd>shift+cmd/ctrl+f</kbd> - replace
* <kbd>shift+cmd/ctrl+r</kbd> - replace all
* <kbd>cmd/ctrl+g</kbd> - jump to line (you can also use <line>:<character> notation, or go relative lines with +<line> and -<line>)
* <kbd>cmd/ctrl+/</kbd> - Add or toggle a checkbox
* <kbd>cmd/ctrl+s</kbd> - ...this does nothing.

## Download
Recent downloads for macOS, Windows and Linux available on https://fromscratch.rocks

For Arch users, [FromScratch is available on AUR](https://aur.archlinux.org/packages/fromscratch-bin/)

For macOS, you can also install FromScratch via Homebrew: ```$ brew cask install fromscratch```

### Installation
```sh
# Download from git
git clone https://github.com/kilian/fromscratch.git

# Install dependencies
cd fromscratch && npm install

# build and run
npm build
electron main.js

# or run dev version
npm run dev
```
### FAQ
*Where is my data saved?*

Your data is saved in a plain text file content.txt. On Mac and Linux, this file is saved in ~/.fromscratch. On Windows
this file is saved in a directory called ".fromscratch" in your userprofile directory.

### Credits

FromScratch is built upon these open source projects:
	<a href="http://electron.atom.io">Electron</a>,
	<a href="https://facebook.github.io/react/">React</a>,
	<a href="https://github.com/tonsky/FiraCode">Fira Code</a>,
	<a href="http://codemirror.net/">CodeMirror</a> and
	<a href="https://github.com/chentsulin/electron-react-boilerplate">Electron-react-boilerplate</a>.

Thanks to @bittersweet for helping me set up IPC to work around a particularly nasty bug, and @chentsulin for the electron-react-boilerplate.
