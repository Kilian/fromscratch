import React from 'react';
import ReactDOM from 'react-dom';
import Ionicon from 'react-ionicons'

import ProjectItem from './ProjectItem'
import Prompt from './Prompt'

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
        this.state = {
            prompt: {
                show: false,
            },
            open: true
        };
        projects.refreshProjectsTree();
    }

    createProject = (name) => {
        this.hidePrompt();
        projects.createProject(name);
        this.refreshSidebar();
    }

    showCreateProjectPrompt = (ev) => {
        this.promptData = {
            instructions: 'Enter a unique name for new project',
            submitDesc: 'Create',
            cancelDesc: 'Cancel'
        };
        this.promptMethods = {
            onSubmit: this.createProject,
            onCancel: this.hidePrompt,
            validateInput: this.validateProjectName
        };
        this.setState({prompt: {show: true}});
    }

    hidePrompt = (ev) => {
        this.setState({prompt: {show: false}});
    }

    validateProjectName = (value) => {
        if(value === '')
            return { valid: false, message: 'You have to provide SOME name...' };

        let duplicates = Object.keys(projects.tree).filter(p => p === value);
        if(duplicates.length)
            return {valid: false, message: 'Project name has to be unique.'};

        return {valid: true, message: ''};
    }

    refreshSidebar = () => {
        projects.refreshProjectsTree();
        this.componentWillMount();
        this.forceUpdate();
    };

    toggleSidebar = () => {
        this.setState({open: !this.state.open});
    }

    componentWillMount() {
        this.sidebarItems = Object.entries(projects.tree).map((item, i) => {
            let key = (new Date).getTime() + ':' + i;
            return (
                <ProjectItem project={item[0]} scratches={item[1]} refreshScratch={this.props.refreshScratch} refreshSidebar={this.refreshSidebar} key={key} />
            );
        });
        if(!this.sidebarItems.length)
            this.sidebarItems = (
                <div className="no-projects-message">
                    <p>Currently you have no projects.</p>
                    <p>To create one, use the plus icon in the top left corner.</p>
                </div>
            );
    }

    render() {

        return (
            <div className={'sidebar ' + (this.state.open ? 'open' : 'closed')}>

                <div className="new-project" onClick={this.showCreateProjectPrompt}>
                    <span className="new-project-label">Create new project</span>
                    <Ionicon icon="ion-ios-plus-outline" fontSize="20px" className="sidebar-icon new-project-handle" />
                    <span className="sidebar-title">Your projects</span>
                </div>

                <Prompt show={this.state.prompt.show} textData={this.promptData} methods={this.promptMethods} mode="input" />

                <div className="sidebar-tree">
                    {this.sidebarItems}
                </div>

                <div className="collapse-handle-container" onClick={this.toggleSidebar}>
                    <Ionicon icon="ion-ios-arrow-left" fontSize="35px" className="collapse-handle" />
                </div>
            </div>
        );
    }
}
