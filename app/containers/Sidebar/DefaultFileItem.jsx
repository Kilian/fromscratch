import React from 'react';
import Ionicon from 'react-ionicons'

const electron = require('electron');
const remote   = electron.remote;
const projects = remote.getGlobal('projects');
const signals  = remote.getGlobal('signalEmitter');
const utils    = remote.getGlobal('utils');
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
        this.props.refreshScratch();
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
                    <Ionicon icon="ion-ios-compose-outline" fontSize="20px" className="sidebar-icon" />
                    <span className="label">Default workspace</span>
                </div>
            </div>
        );
    }
}
