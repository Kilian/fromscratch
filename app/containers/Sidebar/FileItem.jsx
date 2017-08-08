import React from 'react';
import Ionicon from 'react-ionicons'

import Prompt from './Prompt'
import ItemActions from './ItemActions'

const electron      = require('electron');
const remote        = electron.remote;
const projects      = remote.getGlobal('projects');
const signals       = remote.getGlobal('signalEmitter');
const utils         = remote.getGlobal('utils');
let latestVersion;

export default class FileItem extends React.Component {

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
        this.props.refreshScratch();
        signals.dispatch('adjust-file-item-state', '/Default');
    }

    hidePrompt = () => {
        this.setState({prompt: {show: false}});
        this.props.compensateHeight(false);
    }

    onSignal = (currentActiveName) => {
        if(this._mounted)
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

    componentDidMount() {
        this._mounted = true;
    }

    componentWillUnmount() {
        signals.unsubscribe('adjust-file-item-state', this.onSignal);
        this._mounted = false;
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
