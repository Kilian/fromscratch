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
const signals         = remote.getGlobal('signalEmitter');
const utils           = remote.getGlobal('utils');
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
        rootNodeStorage.setItem('sidebar', !this.state.open);
        this.setState({open: !this.state.open});
    }

    componentDidMount() {
        const editor = this.editor;
        ipc.on('executeShortCut', (event, shortcut) => {
            switch (shortcut) {
                case 'toggle-sidebar':
                    console.log('should toggle sidebar'); // TODO: feature
                    this.toggleSidebar();
                    break;
                case 'reset-font':
                    console.log('should reset font'); // TODO: feature
                //   this.updateFont(0, true);
                    break;
                case 'increase-font':
                    console.log('should reset font'); // TODO: feature
                    // this.updateFont(0.1);
                    break;
                case 'decrease-font':
                    console.log('should reset font'); // TODO: feature
                    // this.updateFont(-0.1);
                    break;
                case 'toggle-theme':
                    console.log('should update theme'); // TODO: feature
                    // this.updateTheme();
                    break;
                default:
                    break;
          }
       });
    }

    componentWillMount() {
        this.sidebarItems = Object.keys(projects.tree).map((project, i) => {
            let key = (new Date).getTime() + ':' + i;
            let open = projects.openProjects[project];
            return (
                <ProjectItem project={project} scratches={projects.tree[project]} refreshScratch={this.props.refreshScratch} refreshSidebar={this.refreshSidebar} key={key} open={open}/>
            );
        });
        if(!this.sidebarItems.length)
            this.sidebarItems = (
                <div className="no-projects-message">
                    <p>Currently you have no projects.</p>
                    <p>To create one, use the plus icon in the top left corner.</p>
                </div>
            );

            setTimeout(() => signals.dispatch('adjust-file-item-state', projects.current.project + '/' + projects.current.scratch) , 500);
    }

    render() {

        return (
            <div className={'sidebar ' + (this.state.open ? 'open' : 'closed')}>

                <div className="new-project" onClick={this.showCreateProjectPrompt}>
                    <span className="new-project-label">Create new project</span>
                    <span className="sidebar-icon new-project-handle"><Plus width={20} height={20}/></span>
                    <span className="sidebar-title">Your projects</span>
                </div>

                <Prompt show={this.state.prompt.show} textData={this.promptData} methods={this.promptMethods} mode="input" />

                <DefaultFileItem refreshScratch={this.props.refreshScratch} />

                <div className="sidebar-tree">
                    {this.sidebarItems}
                </div>

                {/* <div className="collapse-handle-container" onClick={this.toggleSidebar}> */}
                    {/* toggle handle */}
                {/* </div> */}
            </div>
        );
    }
}
