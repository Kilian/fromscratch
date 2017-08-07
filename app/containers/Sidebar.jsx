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
        this.state = {
            prompt: {
                show: false,
            }
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

    componentWillMount() {
        this.sidebarItems = Object.entries(projects.tree).map((item, i) => {
            let key = (new Date).getTime() + ':' + i;
            return (
                <ProjectItem project={item[0]} scratches={item[1]} refreshScratch={this.props.refreshScratch} refreshSidebar={this.refreshSidebar} key={key} />
            );
        });
    }

    render() {

        return (
            <div className="sidebar">

                <div className="new-project" onClick={this.showCreateProjectPrompt}>
                    <span className="new-project-label">Create new project</span>
                    <Ionicon icon="ion-ios-plus-outline" fontSize="20px" className="sidebar-icon new-project-handle" />
                    <span className="sidebar-title">Your projects</span>
                </div>

                <Prompt show={this.state.prompt.show} textData={this.promptData} methods={this.promptMethods} mode="input" />

                <div className="sidebar-tree">
                    {this.sidebarItems}
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


class FileItem extends React.Component {

    constructor(props) {
        super();
        if(!props.dummy){
            this.state = {
                active: false,
                prompt: {
                    show: false
                }
            };
            this.name = props.data.project + '/' + props.data.scratch;

            this.actionMethods = {
                remove: this.showRemoveScratchPrompt,
                rename: this.showRenameScratchPrompt,
            };

            signals.subscribe('adjust-file-item-state', this.onSignal);
        }
    }

    showRenameScratchPrompt = () => {
        this.promptData = {
            instructions: 'Enter a new name for '+this.props.data.scratch+' scratch.',
            submitDesc: 'Rename',
            cancelDesc: 'Cancel'
        };
        this.promptMethods = {
            onSubmit: this.renameScratch,
            onCancel: this.hidePrompt,
            validateInput: this.validateScratchName
        };
        this.promptMode = 'input';
        this.setState({prompt: {show: true}});
        this.props.compensateHeight(true);
    }

    validateScratchName = (value) => {
        if(value === '')
            return { valid: false, message: 'You have to provide SOME name...' };
        if(value === this.props.data.scratch)
            return { valid: false, message: 'You have to provide a different name...' };

        let duplicates = projects.tree[this.props.data.project].filter(s => s === value);
        if (duplicates.length)
            return { valid: false, message: 'Scratch name has to be unique project-wide.' };

        return { valid: true, message: '' };
    }

    renameScratch = (name) => {
        this.hidePrompt();
        projects.renameScratch(this.props.data.project, this.props.data.scratch, name);
        this.props.refreshSidebar();
    }

    showRemoveScratchPrompt = () => {
        this.promptData = {
            instructions: 'Do you really want to remove scratch '+this.props.data.project+'/'+this.props.data.scratch+'? This cannot be undone.',
            submitDesc: 'Remove',
            cancelDesc: 'Cancel'
        };
        this.promptMethods = {
            onSubmit: this.removeScratch,
            onCancel: this.hidePrompt,
        };
        this.promptMode = 'prompt';
        this.setState({prompt: {show: true}});
        this.props.compensateHeight(true);
    }

    removeScratch = () => {
        this.hidePrompt();
        projects.removeScratch(this.props.data.project, this.props.data.scratch);
        this.props.refreshSidebar();
    }

    hidePrompt = () => {
        this.setState({prompt: {show: false}});
        this.props.compensateHeight(false);
    }

    onSignal = (currentActiveName) => {
        this.setState({active: currentActiveName === this.name});
    }

    onClick = (ev) => {
        if (this.state.active)
            return;

        projects.setCurrentScratch(this.props.data);
        this.props.refreshScratch();
        signals.dispatch('adjust-file-item-state', this.name);
        this.setState({active: true});
    }

    componentWillUnmount() {
        signals.unsubscribe('adjust-file-item-state', this.onSignal);
    }

    render() {
        if(this.props.dummy)
            return (
                <div className="file dummy">
                    <span className="label">(empty)</span>
                </div>
            );
        else
            return (
                <div className="file-wrapper">

                    <div className={'file ' + (this.state.active ? 'active' : '')} onClick={this.onClick}>
                        <Ionicon icon="ion-ios-compose-outline" fontSize="20px" className="sidebar-icon" />
                        <span className="label">{this.props.name}</span>
                        <span className="actions"><ItemActions mode="scratch" methods={this.actionMethods} /></span>

                    </div>
                    <Prompt show={this.state.prompt.show} textData={this.promptData} methods={this.promptMethods} mode={this.promptMode} />
                </div>
            );
    }
}


class ItemActions extends React.Component {

    constructor(props) {
        super();
        // pass methods = {add: (), remove: (), rename: ()} callbacks through props
        // some kind of dialog for new name / confirm dialog - let passed methods handle this
    }

    onClick = (ev, method) => {
        ev.preventDefault();
        ev.stopPropagation();

        console.log('[ITEM ACTION]', method, this.props.mode);

        if(this.props.methods[method])
            this.props.methods[method]();
    }

    render() {

        if(this.props.mode === 'project')
            var add = [(
                <span className="item-action action-add" title={'Add new scratch'}>
                    <Ionicon icon="ion-ios-plus-empty" fontSize="20px" className="sidebar-icon" />
                </span>
            )];

        return (
            <span className="item-actions">
                {this.props.mode === 'project' && (
                    <span className="item-action action-add" title={'Add new scratch'} onClick={(ev) => this.onClick(ev, 'add')}>
                        <Ionicon icon="ion-ios-plus-empty" fontSize="20px" className="sidebar-icon" />
                    </span>
                )}
                <span className="item-action action-remove" title={'Remove ' + this.props.mode} onClick={(ev) => this.onClick(ev, 'remove')}>
                    <Ionicon icon="ion-ios-trash-outline" fontSize="20px" className="sidebar-icon" />
                </span>
                <span className="item-action action-rename" title={'Rename ' + this.props.mode} onClick={(ev) => this.onClick(ev, 'rename')}>
                    <Ionicon icon="ion-ios-at" fontSize="20px" className="sidebar-icon" />
                </span>
            </span>
        );
    }
}


class Prompt extends React.Component {

    // modes:
    //   simple
    //   input
    constructor(props){
        super();
        this.state = {
            validation: {valid: true, message: ''}
        };
        this.inputValue = '';
    }

    onInputChange = (ev) => {
        this.inputValue = ev.target.value;
        this.setState({validation: this.props.methods.validateInput(this.inputValue)});
    }

    onCancel = (ev) => {
        this.state.validation = {valid: true, message: ''};
        if(this.props.mode === 'input') this.inputValue = '';
        this.props.methods.onCancel(ev);
    }

    onSubmit = (ev) => {
        if(this.props.mode === 'input'){
            if(this.inputValue === ''){
                this.setState({validation: {valid: false, message: 'You have to provide a value.'}});
                return;
            }
            this.props.methods.onSubmit(this.inputValue);
            this.inputValue = '';
        } else {
            this.props.methods.onSubmit();
        }
    }

    render() {
        if(!this.props.show) return null;

        if (this.props.mode === 'input'){
            var input = (
                <div className="prompt-input-wrapper">
                    <input className="prompt-input" type="text" value={this.inputValue} onChange={this.onInputChange}/>
                    <p className="prompt-error">{this.state.validation.message}</p>
                </div>
            );
        }

        return (
            <div className={'prompt ' + (this.state.validation.valid ? '' : 'invalid')}>
                <p className="prompt-instructions">{this.props.textData.instructions}</p>
                {input}
                <div className="prompt-footer">
                    <div className="prompt-button submit" onClick={this.onSubmit}>
                        <Ionicon icon="ion-ios-checkmark-outline" fontSize="20px" className="sidebar-icon" />
                        {this.props.textData.submitDesc}
                    </div>
                    <div className="prompt-button cancel" onClick={this.onCancel}>
                        <Ionicon icon="ion-ios-close-outline" fontSize="20px" className="sidebar-icon" />
                        {this.props.textData.cancelDesc}
                    </div>
                </div>
            </div>
        );
    }
}
