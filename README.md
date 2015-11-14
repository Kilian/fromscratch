# FromScratch

A simple autosaving scratchpad using Fira code. Built with Electron, React and Webpack using https://github.com/chentsulin/electron-react-boilerplate

## Currently broken :(

* Writing the file to disk on change somehow triggers a second paste, tab and newline (Problem in React/Electron)
* When built, the Fira Code font isn't loaded correctly. (Problem in ...Webpack?)

### Usage
```sh
# Download from git
git clone https://github.com/kilian/fromscratch.git

# Install dependencies
cd fromscratch && npm install

# build and run
npm build
electron main.js

# or run dev version
npm run hot-server

#in a different terminal:
npm run start-hot
```
