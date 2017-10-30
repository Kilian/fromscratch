import React from 'react';
import ReactDOM from 'react-dom';
import FromScratch from './containers/FromScratch';
import Sidebar from './containers/Sidebar/Sidebar';
import './assets/style/app.scss';

const electron = require('electron');
const ipc = electron.ipcRenderer;

window.location.hash = '/';


class MainApp extends React.Component {

    constructor() {
        super();
        this.workspaceKey = 1;

        ipc.setMaxListeners(Infinity); // for 'adjustFileItemState' channel - after all user can have as many scratches as he wishes
    }

    componentDidMount() {
        ipc.on('refreshWorkspace', (event) => this.refreshWorkspace() );
    }

    refreshWorkspace() {
        this.workspaceKey++;
        this.forceUpdate();
    }

    render() {
        return (
            <div id="main-container">
                <div id="sidebar-container">
                    <Sidebar refreshScratch={this.refreshWorkspace.bind(this)}/>
                </div>
                <div id="workspace-container">
                    <FromScratch key={this.workspaceKey}/>
                </div>
            </div>
        );
    }

}

ReactDOM.render(<MainApp />, document.getElementById('react-root'));
