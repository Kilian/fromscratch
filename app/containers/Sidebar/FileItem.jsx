import React from 'react';
import { Compose } from 'react-bytesize-icons';

import Prompt from './Prompt'
import ItemActions from './ItemActions'

const electron     = require('electron');
const remote       = electron.remote;
const projects     = remote.getGlobal('projects');
const utils        = remote.getGlobal('utils');
const eventEmitter = remote.getGlobal('eventEmitter');
const ipc          = electron.ipcRenderer;
let latestVersion;

export default class FileItem extends React.Component {

    constructor(props) {
        super();
        if(!props.dummy){
            this.state = {
                active: false,
                prompt: false
            };
            this.name = props.data.project + '/' + props.data.scratch;

            this.actionMethods = {
                remove: this.showRemoveScratchPrompt,
                rename: this.showRenameScratchPrompt,
            };
        }
    }

    componentDidMount() {
        ipc.on('adjustFileItemState', this.setActiveState);
    }

    componentWillUnmount() {
        ipc.removeListener('adjustFileItemState', this.setActiveState);
    }

    setActiveState = (ev, currentActiveName) => {
        this.setState({active: currentActiveName === this.name});
    }

    showRenameScratchPrompt = () => {
        this.promptLabel = 'Rename';
        this.promptInitial = this.props.data.scratch;
        this.promptMethods = {
            onSubmit: this.renameScratch,
            onCancel: this.hidePrompt,
            validateInput: this.validateScratchName
        };
        this.promptMode = 'input';
        this.setState({prompt: true});
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
        eventEmitter.emit('refreshSidebar');
    }

    showRemoveScratchPrompt = () => {
        this.promptLabel = `Remove ${this.props.data.project}/${this.props.data.scratch}?`;
        this.promptMethods = {
            onSubmit: this.removeScratch,
            onCancel: this.hidePrompt,
        };
        this.promptMode = 'prompt';
        this.setState({prompt: true});
    }

    removeScratch = () => {
        this.hidePrompt();
        projects.removeScratch(this.props.data.project, this.props.data.scratch);
        eventEmitter.emit('refreshSidebar');
        eventEmitter.emit('refreshWorkspace');
        eventEmitter.emit('adjustFileItemState', '/Default');
    }

    hidePrompt = () => {
        this.setState({prompt: false});
    }

    onClick = (ev) => {
        if (this.state.active)
            return;
        projects.setCurrentScratch(this.props.data);
        eventEmitter.emit('refreshWorkspace');
        eventEmitter.emit('adjustFileItemState', this.name);
        this.setState({active: true});
    }

    render() {
        if(this.props.dummy) {
            return (
                <div className="file dummy">
                    <span className="label">(empty)</span>
                </div>
            );
        } else {
            const display = this.state.prompt ? (
                <Prompt indentLevel="file-indent" label={this.promptLabel} initialValue={this.promptInitial} methods={this.promptMethods} mode={this.promptMode} />
            ) : (
                <div className={'file ' + (this.state.active ? 'active' : '')} onClick={this.onClick} title={this.name}>
                    <span className="sidebar-icon"><Compose width={20} height={20}/></span>
                    <span className="label">{this.props.name}</span>
                    <span className="actions"><ItemActions mode="scratch" methods={this.actionMethods} /></span>
                </div>
            );

            return (
                <div className="file-wrapper"> {display} </div>
            );
        }
    }
}
