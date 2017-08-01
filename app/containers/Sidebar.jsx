import React from 'react';
import SignalEmitter from '../mainApp.jsx'

const electron      = require('electron');
const ipc           = electron.ipcRenderer;
const remote        = electron.remote;
const shell         = electron.shell;
const handleContent = remote.getGlobal('handleContent');
const nodeStorage   = remote.getGlobal('nodeStorage');
const projects      = remote.getGlobal('projects');
const signals       = remote.getGlobal('signalEmitter');
let latestVersion;


class FileItem extends React.Component {

    constructor(props) {
        super();
        this.state = { active: false };
        this.name = props.data.project + '/' + props.data.scratch;
        signals.subscribe('adjust-file-item-state', this.onSignal);
    }

    onSignal = (currentActiveName) => {
        this.state.active = currentActiveName === this.name;
        this.forceUpdate();
    }

    onClick = (ev) => {
        if (this.state.active)
            return;

        projects.setCurrentScratch(this.props.data);
        this.props.refreshScratch();
        this.state.active = true;
        signals.dispatch('adjust-file-item-state', this.name);
        this.forceUpdate();
    }

    render() {
        return (
            <div className={'file ' + (this.state.active ? 'active' : '')} onClick={this.onClick}>
                {this.props.name}
            </div>
        )
    }
}


class ProjectItem extends React.Component {

    constructor(props){
        super();
        this.state = { active: false };
    }

    onClick = (ev) => {
        this.state.active = !this.state.active;
        this.forceUpdate();
    }

    render(){
        let self      = this;
        let project   = this.props.project;
        let scratches = this.props.scratches.map(scratch => {
            return (
                <FileItem name={scratch} refreshScratch={self.props.refreshScratch} data={{ project: project, scratch: scratch }} />
            );
        });

        return (
            <div className={'project ' + (this.state.active ? 'active' : '')}>
                <div className="project-label" onClick={this.onClick}>{project}</div>
                {scratches}
            </div>
        );
    }
}


export default class Sidebar extends React.Component {

    constructor(props) {
        super();
        this.state = {};
        projects.refreshProjectsTree();
    }

    render() {
        let self = this;

        let sidebarItems = Object.entries(projects.tree).map((item, i) => {
            return (
                <ProjectItem project={item[0]} scratches={item[1]} refreshScratch={self.props.refreshScratch} />
            );
        });

        return (
            <div className="sidebar">

                <div className="sidebar-controls">
                    <div className="control" id="new-project">new</div>
                </div>

                <div className="sidebar-tree">
                    {sidebarItems}
                </div>

            </div>
        );
    }

}
