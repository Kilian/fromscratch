import React from 'react';
import ReactDOM from 'react-dom';
import { Plus } from 'react-bytesize-icons';

import ProjectItem from './ProjectItem'
import Prompt from './Prompt'
import DefaultFileItem from './DefaultFileItem'

const electron        = require('electron');
const ipc             = electron.ipcRenderer;
const remote          = electron.remote;
const rootNodeStorage = remote.getGlobal('rootNodeStorage');
const projects        = remote.getGlobal('projects');
const utils           = remote.getGlobal('utils');
const eventEmitter    = remote.getGlobal('eventEmitter');
let latestVersion;


export default class Sidebar extends React.Component {

    constructor(props) {
        super();
        this.state = {
            prompt: {
                show: false,
            },
            open: rootNodeStorage.getItem('sidebar') || false
        };
        projects.refreshProjectsTree();
    }

    createProject = (name) => {
        this.hidePrompt();
        projects.createProject(name);
        this.refreshSidebar();
    }

    showCreateProjectPrompt = () => {
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
        rootNodeStorage.setItem('sidebar', !this.state.open);
        this.setState({open: !this.state.open});
    }

    componentWillMount() {
        this.sidebarItems = Object.keys(projects.tree).map((project, i) => {
            let key = (new Date).getTime() + ':' + i;
            let open = projects.openProjects[project];
            return (
                <ProjectItem project={project} scratches={projects.tree[project]} refreshScratch={this.props.refreshScratch} refreshSidebar={this.refreshSidebar} key={key} open={open}/>
            );
        });
        if(!this.sidebarItems.length) {
            this.sidebarItems = (
                <div className="no-projects-message">
                    <p>No projects to show yet.</p>
                </div>
            );
        }
    }

    componentDidMount() {
        eventEmitter.emit('adjustFileItemState', projects.current.project + '/' + projects.current.scratch)

        ipc.on('executeShortCut', (event, shortcut) => {
            switch (shortcut) {
                case 'toggle-sidebar':
                    this.toggleSidebar();
                    break;
            }
        });
    }

    render() {
        return (
            <div className={'sidebar ' + (this.state.open ? 'open' : 'closed')}>
                <DefaultFileItem refreshScratch={this.props.refreshScratch} createNewProject={this.showCreateProjectPrompt}/>
                <Prompt show={this.state.prompt.show} textData={this.promptData} methods={this.promptMethods} mode="input" />
                {this.sidebarItems}
            </div>
        );
    }
}
