import React from 'react';
import Ionicon from 'react-ionicons'

import FileItem from './FileItem'
import Prompt from './Prompt'
import ItemActions from './ItemActions'

const electron      = require('electron');
const remote        = electron.remote;
const projects      = remote.getGlobal('projects');
const signals       = remote.getGlobal('signalEmitter');
const utils         = remote.getGlobal('utils');
let latestVersion;


export default class ProjectItem extends React.Component {

    constructor(props) {
        super();
        this.state = {
            open: false,  // if expanded (scratches inside are visible) or not
            prompt: { show: false }
        };
        this.actionMethods = {
            add: this.showAddScratchPrompt,
            remove: this.showRemoveProjectPrompt,
            rename: this.showRenameProjectPrompt,
        };
        this.computedStyle = {};
        this.parentClasses = ['project']
    }

    onClick = (ev) => {
        let shouldOpen = !this.state.open;
        this.openHeight = this.props.scratches.length ? (this.props.scratches.length * 26) : 26;
        this.parentClasses = shouldOpen ? utils.addClass(this.parentClasses, 'open') : utils.removeClass(this.parentClasses, 'open');
        this.computedStyle = !shouldOpen ? {} : {maxHeight: this.openHeight + 'px'};
        this.setState({open: shouldOpen});
    }

    showAddScratchPrompt = () => {
        this.promptData = {
            instructions: 'Enter a name for new scratch. Has to be unique project-wide.',
            submitDesc: 'Create',
            cancelDesc: 'Cancel'
        };
        this.promptMethods = {
            onSubmit: this.createScratch,
            onCancel: this.hidePrompt,
            validateInput: this.validateScratchName
        };
        this.promptMode = 'input';
        this.setState({prompt: {show: true}});
    }

    validateScratchName = (value) => {
        if(value === '')
            return { valid: false, message: 'You have to provide SOME name...' };

        let duplicates = projects.tree[this.props.project].filter(s => s === value);
        if (duplicates.length)
            return { valid: false, message: 'Scratch name has to be unique project-wide.' };

        return { valid: true, message: '' };
    }

    createScratch = (name) => {
        this.hidePrompt();
        projects.createScratch(this.props.project, name);
        this.props.refreshSidebar();
    }

    showRenameProjectPrompt = () => {
        this.promptData = {
            instructions: 'Enter a new unique name for '+this.props.project+' project.',
            submitDesc: 'Rename',
            cancelDesc: 'Cancel'
        };
        this.promptMethods = {
            onSubmit: this.renameProject,
            onCancel: this.hidePrompt,
            validateInput: this.validateProjectName
        };
        this.promptMode = 'input';
        this.setState({prompt: {show: true}});
    }

    validateProjectName = (value) => {
        if(value === '')
            return { valid: false, message: 'You have to provide SOME name...' };
        if(value === this.props.project)
            return { valid: false, message: 'You have to provide a different name...' };

        let duplicates = Object.keys(projects.tree).filter(p => p === value);
        if(duplicates.length)
            return {valid: false, message: 'Project name has to be unique.'};

        return {valid: true, message: ''};
    }

    renameProject = (name) => {
        this.hidePrompt();
        projects.renameProject(this.props.project, name);
        this.props.refreshSidebar();
    }

    showRemoveProjectPrompt = () => {
        this.promptData = {
            instructions: 'Do you really want to remove project ' + this.props.project + '? This cannot be undone.',
            submitDesc: 'Remove',
            cancelDesc: 'Cancel'
        };
        this.promptMethods = {
            onSubmit: this.removeProject,
            onCancel: this.hidePrompt,
        };
        this.promptMode = 'prompt';
        this.setState({prompt: {show: true}});
    }

    removeProject = (name) => {
        this.hidePrompt();
        projects.removeProject(this.props.project);
        this.props.refreshSidebar();
        this.props.refreshScratch();
    }

    hidePrompt = () => {
        this.setState({prompt: {show: false}});
    }

    compensateForFilePrompt = (stretch) => {
        let adjustment = 150;
        let current = this.computedStyle.maxHeight;
        this.computedStyle = {maxHeight: stretch ? (this.openHeight + adjustment) + 'px' : this.openHeight + 'px'};
        this.forceUpdate();
    }

    componentWillMount() {
        this.scratches = this.props.scratches.map((scratch, i) => {
            let key = (new Date).getTime() + ':' + i;
            return (
                <FileItem name={scratch} compensateHeight={this.compensateForFilePrompt}
                    refreshScratch={this.props.refreshScratch} refreshSidebar={this.props.refreshSidebar}
                    data={{ project: this.props.project, scratch: scratch }} key={key} />
            );
        });
        if(!this.scratches.length)
            this.scratches = [(
                <FileItem dummy={true} key={(new Date).getTime() + ':0'}/>
            )];
    }

    render() {
        return (
            <div className={this.parentClasses.join(' ')}>
                <div className="project-label" onClick={this.onClick}>
                    <Ionicon icon="ion-ios-arrow-right" fontSize="20px" className="sidebar-icon project-label-icon" />
                    <span className="label">{this.props.project}</span>
                    <span className="actions"><ItemActions mode="project" methods={this.actionMethods} /></span>
                </div>

                <Prompt show={this.state.prompt.show} textData={this.promptData} methods={this.promptMethods} mode={this.promptMode} />

                <div className="file-items-container" style={this.computedStyle}>
                    {this.scratches}
                </div>
            </div>
        );
    }
}
