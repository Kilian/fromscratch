import React from 'react';
import ReactDOM from 'react-dom';
import Ionicon from 'react-ionicons'

// require('../../node_modules/codemirror/addon/scroll/simplescrollbars.js');
// require('../../node_modules/codemirror/addon/search/matchesonscrollbar.js');

const electron      = require('electron');
const ipc           = electron.ipcRenderer;
const remote        = electron.remote;
const shell         = electron.shell;
const handleContent = remote.getGlobal('handleContent');
const nodeStorage   = remote.getGlobal('nodeStorage');
const projects      = remote.getGlobal('projects');
const signals       = remote.getGlobal('signalEmitter');
const utils         = remote.getGlobal('utils');
let latestVersion;


export default class Sidebar extends React.Component {

    constructor(props) {
        super();
        this.state = {};
        projects.refreshProjectsTree();
    }

    render() {
        let self = this;

        let sidebarItems = Object.entries(projects.tree).map((item, i) => {
            let key = (new Date).getTime() + ':' + i;
            return (
                <ProjectItem project={item[0]} scratches={item[1]} refreshScratch={self.props.refreshScratch} key={key} />
            );
        });

        return (
            <div className="sidebar">

                <div className="new-project" id="new-project">
                    <span className="new-project-label">Create new project</span>
                    <Ionicon icon="ion-ios-plus-outline" fontSize="20px" className="sidebar-icon new-project-handle" />
                    <span className="sidebar-title">Your projects</span>
                </div>

                <div className="sidebar-tree">
                    {sidebarItems}
                </div>

            </div>
        );
    }

}


class ProjectItem extends React.Component {

    constructor(props) {
        super();
        this.state = {
            open: false,  // if expanded (scratches inside are visible) or not
            active: false // if one of the child scratches is the currently selected scratch
        };
        this.computedStyle = {};
        this.parentClasses = ['project']
    }

    componentWillMount() {
        let self = this;
        this.scratches = this.props.scratches.map((scratch, i) => {
            let key = (new Date).getTime() + ':' + i;
            return (
                <FileItem name={scratch} refreshScratch={self.props.refreshScratch} data={{ project: this.props.project, scratch: scratch }} key={key} />
            );
        });
    }

    onClick = (ev) => {
        this.state.open = !this.state.open;
        this.parentClasses = this.state.open ? utils.addClass(this.parentClasses, 'open') : utils.removeClass(this.parentClasses, 'open');
        this.computedStyle = !this.state.open ? {} : {
            maxHeight: (this.props.scratches.length * 26) + 'px'
        };
        this.forceUpdate();
    }

    render() {
        return (
            <div className={this.parentClasses.join(' ')}>
                <div className="project-label" onClick={this.onClick}>
                    <Ionicon icon="ion-ios-arrow-right" fontSize="20px" className="sidebar-icon project-label-icon" />
                    <span className="label">{this.props.project}</span>
                    <span className="actions"><ItemActions parentName="project" /></span>
                </div>
                <div className="file-items-container" style={this.computedStyle}>
                    {this.scratches}
                </div>
            </div>
        );
    }
}


class FileItem extends React.Component {

    constructor(props) {
        super();
        this.state = { active: false };
        this.name = props.data.project + '/' + props.data.scratch;

        signals.subscribe('adjust-file-item-state', this.onSignal);
    }

    componentWillUnmount() {
        signals.unsubscribe('adjust-file-item-state', this.onSignal);
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
                <Ionicon icon="ion-ios-compose-outline" fontSize="20px" className="sidebar-icon" />
                <span className="label">{this.props.name}</span>
                <span className="actions"><ItemActions parentName="scratch" /></span>
            </div>
        )
    }
}


class ItemActions extends React.Component {

    constructor(props) {
        super();
        // pass onRename / onRemove callbacks through props - will change between project and file
        // some kind of dialog for new name / confirm dialog
    }

    render() {
        return (
            <span className="item-actions">
                <span className="item-action action-remove" title={'Remove ' + this.props.parentName}>
                    <Ionicon icon="ion-ios-trash-outline" fontSize="20px" className="sidebar-icon" />
                </span>
                <span className="item-action action-rename" title={'Rename ' + this.props.parentName}>
                    <Ionicon icon="ion-ios-at" fontSize="20px" className="sidebar-icon" />
                </span>
            </span>
        );
    }
}
