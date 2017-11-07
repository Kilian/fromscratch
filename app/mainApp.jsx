import React from 'react';
import ReactDOM from 'react-dom';
import FromScratch from './containers/FromScratch';
import Sidebar from './containers/Sidebar/Sidebar';
import './assets/style/app.scss';

const electron        = require('electron');
const ipc             = electron.ipcRenderer;
const remote          = electron.remote;
const rootNodeStorage = remote.getGlobal('rootNodeStorage');

window.location.hash = '/';


class MainApp extends React.Component {

    constructor() {
        super();
        this.state = {
            lightTheme: rootNodeStorage.getItem('lightTheme') || false,
        };

        this.workspaceKey = 1;

        ipc.setMaxListeners(Infinity); // for 'adjustFileItemState' channel - after all user can have as many scratches as he wishes
    }

    componentDidMount() {
        ipc.on('refreshWorkspace', this.refreshWorkspace);
        ipc.on('executeShortCut', this.dispatchShortcutCallback);
    }

    componentWillUnmount() {
        ipc.removeListener('refreshWorkspace', this.refreshWorkspace);
        ipc.removeListener('executeShortCut', this.dispatchShortcutCallback);
    }

    refreshWorkspace = () => {
        this.workspaceKey++;
        this.forceUpdate();
    }

    dispatchShortcutCallback = (ev, shortcut) => {
        switch (shortcut) {
            case 'toggle-theme':
                this.updateTheme();
                break;
            default:
                break;
        }
    }

    updateTheme() {
        const lightTheme = !this.state.lightTheme;

        rootNodeStorage.setItem('lightTheme', lightTheme);
        this.setState({ lightTheme });
    }

    updateFont(diff, reset) {
        const newFontsize = reset ? 1 : Math.min(Math.max(this.state.fontSize + diff, 0.5), 2.5);
        rootNodeStorage.setItem('fontSize', newFontsize);
        this.setState({ fontSize: newFontsize });
    }

    render() {
        const style = {
            ...(this.state.lightTheme ?
                { filter: 'invert(100%) hue-rotate(90deg) brightness(1.1) grayscale(75%)' }
                :
                {}
            )
        };

        return (
            <div id="main-container" style={style}>
                <div id="sidebar-container">
                    <Sidebar/>
                </div>
                <div id="workspace-container">
                    <FromScratch key={this.workspaceKey}/>
                </div>
            </div>
        );
    }

}

ReactDOM.render(<MainApp />, document.getElementById('react-root'));
