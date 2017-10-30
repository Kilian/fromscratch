import React from 'react';
import { ChevronRight } from 'react-bytesize-icons';

import FileItem from './FileItem'
import Prompt from './Prompt'
import ItemActions from './ItemActions'

const electron     = require('electron');
const remote       = electron.remote;
const projects     = remote.getGlobal('projects');
const utils        = remote.getGlobal('utils');
const eventEmitter = remote.getGlobal('eventEmitter');
const ipc          = electron.ipcRenderer;
let latestVersion;


export default class ProjectItem extends React.Component {

    constructor(props) {
        super();
        this.state = {
            open: false,  // if expanded (scratches inside are visible) or not
            prompt: false,
            newScratch: false
        };
        this.actionMethods = {
            add: this.showAddScratchPrompt,
            remove: this.showRemoveProjectPrompt,
            rename: this.showRenameProjectPrompt,
        };
        this.computedStyle = {};
        this.parentClasses = ['project'];
    }

    onClick = (ev) => {
        let shouldOpen = !this.state.open;
        projects.markProjectOpenness(this.props.project, shouldOpen);
        this.openHeight = this.props.scratches.length ? (this.props.scratches.length * 26) : 26;
        this.parentClasses = shouldOpen ? utils.addClass(this.parentClasses, 'open') : utils.removeClass(this.parentClasses, 'open');
        this.computedStyle = !shouldOpen ? {} : {maxHeight: this.openHeight + 'px'};
        this.setState({open: shouldOpen});
    }

    showAddScratchPrompt = () => {
        this.promptMethods = {
            onSubmit: this.createScratch,
            onCancel: this.hidePrompt,
            validateInput: this.validateScratchName
        };
        this.promptMode = 'input';
        this.setState({prompt: true, newScratch: true});
    }

    validateScratchName = (value) => {
        if(value === '')
            return { valid: false, message: 'You have to provide SOME name...' };

        for (const project of projects.tree) {
            if (project.name === this.props.project) {
                const duplicates = project.scratches.filter(s => s === value);
                if (duplicates.length) {
                    return { valid: false, message: 'Scratch name has to be unique project-wide.' };
                }
            }
        }

        return { valid: true, message: '' };
    }

    createScratch = (name) => {
        this.hidePrompt();
        projects.createScratch(this.props.project, name);
        projects.setCurrentScratch({project: this.props.project, scratch: name});
        eventEmitter.emit('refreshSidebar');
        eventEmitter.emit('refreshWorkspace');
        setTimeout(() => eventEmitter.emit('adjustFileItemState', this.props.project + '/' + name), 200);
    }

    showRenameProjectPrompt = () => {
        this.promptInitial = this.props.project;
        this.promptMethods = {
            onSubmit: this.renameProject,
            onCancel: this.hidePrompt,
            validateInput: this.validateProjectName
        };
        this.promptMode = 'input';
        this.setState({prompt: true});
    }

    validateProjectName = (value) => {
        if(value === '')
            return { valid: false, message: 'You have to provide SOME name...' };
        if(value === this.props.project)
            return { valid: false, message: 'You have to provide a different name...' };

        let duplicates = projects.tree.filter(p => p.name === value);
        if(duplicates.length)
            return {valid: false, message: 'Project name has to be unique.'};

        return {valid: true, message: ''};
    }

    renameProject = (name) => {
        this.hidePrompt();
        projects.renameProject(this.props.project, name);
        eventEmitter.emit('refreshSidebar');
    }

    showRemoveProjectPrompt = () => {
        this.promptLabel = `Remove ${this.props.project} with children?`;
        this.promptMethods = {
            onSubmit: this.removeProject,
            onCancel: this.hidePrompt,
        };
        this.promptMode = 'prompt';
        this.setState({prompt: true});
    }

    removeProject = () => {
        this.hidePrompt();
        if(projects.current.project === this.props.project) {
            eventEmitter.emit('adjustFileItemState', '/Default');
        }
        projects.removeProject(this.props.project);
        eventEmitter.emit('refreshSidebar');
        eventEmitter.emit('refreshWorkspace');
    }

    hidePrompt = () => {
        this.setState({prompt: false, newScratch: false});
        this.promptLabel = null;
        this.promptInitial = null;
    }

    componentWillMount() {
        this.scratches = this.props.scratches.map((scratch, i) => {
            let key = (new Date).getTime() + ':' + i;
            return (
                <FileItem name={scratch} data={{ project: this.props.project, scratch: scratch }} key={key} />
            );
        });
        if(!this.scratches.length)
            this.scratches = [(
                <FileItem dummy={true} key={(new Date).getTime() + ':0'}/>
            )];

        if(this.props.open === true)
            this.onClick();
    }

    render() {
        if (this.state.prompt && !this.state.newScratch) {
            var labelDisplay = (
                <Prompt level="project-level" label={this.promptLabel} initialValue={this.promptInitial} methods={this.promptMethods} mode={this.promptMode} />
            );
        } else {
            var labelDisplay = (
                <div className="project-label" onClick={this.onClick} title={this.props.project}>
                    <span className="sidebar-icon project-label-icon"><ChevronRight width={20} height={20}/></span>
                    <span className="label">{this.props.project}</span>
                    <span className="actions"><ItemActions mode="project" methods={this.actionMethods} /></span>
                </div>
            );
        }

        if (this.state.prompt && this.state.newScratch) {
            var newScratchPrompt = (
                <Prompt level="file-level" label={this.promptLabel} initialValue={this.promptInitial} methods={this.promptMethods} mode={this.promptMode} />
            );
        }

        return (
            <div className={this.parentClasses.join(' ')}>
                {labelDisplay}
                {newScratchPrompt}
                <div className="file-items-container" style={this.computedStyle}>
                    {this.scratches}
                </div>
            </div>
        );
    }
}
