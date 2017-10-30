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
            prompt: false,
            search: false,
            searchValue: null,
            open: rootNodeStorage.getItem('sidebar') || false
        };
        projects.refreshProjectsTree();
    }

    componentWillMount() {

        let filteredProjects = this.state.searchValue === null || this.state.searchValue === '' ? projects.tree :
            projects.tree.slice().map(p => {
                if (!p.name.toLowerCase().includes(this.state.searchValue)) {
                    p.scratches = p.scratches.filter(s => s.toLowerCase().includes(this.state.searchValue));
                }
                return p.scratches.length ? p : null;
            }).filter(p => p !== null);

        this.sidebarItems = filteredProjects.map((project, i) => {
            let key = (new Date).getTime() + ':' + i;
            let open = this.state.search === true ? true : projects.openProjects[project.name];
            return (
                <ProjectItem project={project.name} scratches={project.scratches} key={key} open={open}/>
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
                case 'collapse-all-projects':
                    this.onCollapseAllProjects();
                    break;
                case 'toggle-sidebar':
                    this.toggleSidebar();
                    break;
                case 'search-sidebar':
                    this.toggleSearchPrompt();
                    break;
                default:
                    break;
            }
        });

        ipc.on('refreshSidebar', this.refreshSidebar);
    }

    componentWillUnmount() {
        ipc.removeListener('refreshSidebar', this.refreshSidebar);
        ipc.removeListener('executeShortCut', this.refreshSidebar);
    }

    createProject = (name) => {
        this.hidePrompt();
        projects.createProject(name);
        this.refreshSidebar();
    }

    showCreateProjectPrompt = () => {
        this.hidePrompt();
        this.promptMethods = {
            onSubmit: this.createProject,
            onCancel: this.hidePrompt,
            validateInput: this.validateProjectName
        };
        this.setState({prompt: true});
    }

    hidePrompt = (ev) => {
        this.setState({prompt: false, search: false, searchValue: null});
        this.promptLabel = null;
        this.promptInitial = null;
        this.promptMethods = {};
        setTimeout(() => this.refreshSidebar(), 200);
    }

    validateProjectName = (value) => {
        if(value === '')
            return { valid: false, message: 'You have to provide SOME name...' };

        let duplicates = projects.tree.filter(p => p.name === value);
        if(duplicates.length)
            return {valid: false, message: 'Project name has to be unique.'};

        return {valid: true, message: ''};
    }

    toggleSearchPrompt = () => {
        if (this.state.search === true) {
            this.hidePrompt();
        } else {
            this.hidePrompt();
            this.promptMethods = {
                validateInput: (val) => ({valid: true}),
                onSubmit: this.filterItems
            };
            this.setState({search: true});
        }
    }

    filterItems = (value) => {
        this.state.searchValue = value.toLowerCase();
        this.componentWillMount();
        this.forceUpdate();
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

    onCollapseAllProjects() {
        eventEmitter.emit('collapseAllProjects');
    }

    render() {
        if (this.state.prompt) {
            var newProjectPrompt = (
                <Prompt level="project-level" label={this.promptLabel} initialValue={this.promptInitial} methods={this.promptMethods} mode="input" />
            );
        }

        if (this.state.search) {
            var searchPrompt = (
                <Prompt level="project-level" search={true} methods={this.promptMethods} mode="input" />
            );
        }

        return (
            <div className={'sidebar ' + (this.state.open ? 'open' : 'closed')}>
                <DefaultFileItem createNewProject={this.showCreateProjectPrompt} openSearch={this.toggleSearchPrompt} collapseAll={this.onCollapseAllProjects}/>
                {searchPrompt}
                {newProjectPrompt}
                {this.sidebarItems}
            </div>
        );
    }
}
