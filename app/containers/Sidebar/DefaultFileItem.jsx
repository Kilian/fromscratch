import React from 'react';
import { Compose, Plus } from 'react-bytesize-icons';

const electron = require('electron');
const remote   = electron.remote;
const projects = remote.getGlobal('projects');
const signals  = remote.getGlobal('signalEmitter');
const utils    = remote.getGlobal('utils');

const eventEmitter = remote.getGlobal('eventEmitter');
let latestVersion;

export default class DefaultFileItem extends React.Component {

    constructor(props) {
        super();
        if(!props.dummy){
            this.state = {
                active: false, // user lands at default scratch on start
            };
            this.name = '' + '/' + 'Default';
            signals.subscribe('adjust-file-item-state', this.onSignal);
        }
    }

    onSignal = (currentActiveName) => {
        this.setState({active: currentActiveName === this.name});
    }

    onClick = (ev) => {
        if (this.state.active)
            return;

        projects.setCurrentScratch(undefined, true);

        eventEmitter.send('refreshWorkspace');
        // this.props.refreshScratch();


        signals.dispatch('adjust-file-item-state', this.name);
        this.setState({active: true});
    }

    componentWillMount(){
        if(projects.current.project==='' && projects.current.scratch===this.name)
            signals.dispatch('adjust-file-item-state', this.name);
    }

    componentWillUnmount() {
        signals.unsubscribe('adjust-file-item-state', this.onSignal);
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
