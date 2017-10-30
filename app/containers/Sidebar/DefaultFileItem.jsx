import React from 'react';
import { Compose, Plus } from 'react-bytesize-icons';

const electron     = require('electron');
const remote       = electron.remote;
const projects     = remote.getGlobal('projects');
const utils        = remote.getGlobal('utils');
const eventEmitter = remote.getGlobal('eventEmitter');
const ipc          = electron.ipcRenderer;
let latestVersion;

export default class DefaultFileItem extends React.Component {

    constructor(props) {
        super();
        if(!props.dummy){
            this.state = {
                active: false, // user lands at default scratch on start
            };
            this.name = '' + '/' + 'Default';
        }
    }

    componentDidMount() {
        ipc.on('adjustFileItemState', this.setActiveState);
    }

    componentWillUnmount() {
        ipc.removeListener('adjustFileItemState', this.setActiveState);
    }

    setActiveState = (ev, currentActiveName) => {
        this.setState({active: currentActiveName === this.name});
    }

    onClick = (ev) => {
        if (this.state.active)
            return;
        projects.setCurrentScratch(undefined, true);
        eventEmitter.emit('refreshWorkspace');
        eventEmitter.emit('adjustFileItemState', this.name);
        this.setState({active: true});
    }

    render() {
        return (
            <div className="file-wrapper default">
                <div className={'file default ' + (this.state.active ? 'active' : '')} onClick={this.onClick}>
                    <span className="sidebar-icon"><Compose width={20} height={20}/></span>
                    <span className="label">Default workspace</span>
                    <span className="actions">
                        <span className="item-actions">
                            <span className="item-action action-add" title={'Add new scratch'} onClick={this.props.createNewProject}>
                                <span className="sidebar-icon"><Plus width={20} height={20}/></span>
                            </span>
                        </span>
                    </span>
                </div>
            </div>
        );
    }
}
