import React from 'react';
import { Checkmark, Close, Compose, ChevronRight } from 'react-bytesize-icons';
let latestVersion;


export default class Prompt extends React.Component {

    // modes:
    //   simple
    //   input
    constructor(props){
        super();
        this.state = {
            validation: {valid: true, message: ''}
        };
        this.inputValue = props.initialValue ? props.initialValue : '';
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

    handleKey = (ev) => {
        if(ev.keyCode === 13 && this.state.validation.valid)
            this.onSubmit();
        else if(ev.keyCode === 27)
            this.onCancel();
    }

    render() {
        let input, errorMessage, label, levelIcon;

        if (this.props.mode === 'input'){
            input = (
                <input autoFocus className="prompt-input" type="text" value={this.inputValue} onChange={this.onInputChange} onKeyUp={this.handleKey}/>
            );

            errorMessage = ( <div className="prompt-error">{this.state.validation.message}</div> );
        }

        if (this.props.label) {
            label = ( <span className="prompt-label">{this.props.label}</span> );
        }

        if (this.props.level === 'project-level') {
            levelIcon = ( <span className="sidebar-icon project-label-icon"><ChevronRight width={20} height={20}/></span> );
        } else if (this.props.level === 'file-level') {
            levelIcon = ( <span className="sidebar-icon"><Compose width={20} height={20}/></span> );
        }

        return (
            <div className={'prompt' + (this.state.validation.valid ? '' : ' invalid') + (this.props.level ? ' ' + this.props.level : '')}>
                {levelIcon}
                {label}
                {input}
                <span className="actions">
                    <span className="item-actions">
                        <span className="item-action" onClick={this.onSubmit}>
                            <span className="sidebar-icon submit-button"><Checkmark width={20} height={20}/></span>
                        </span>
                        <span className="item-action" onClick={this.onCancel}>
                            <span className="sidebar-icon" ><Close width={20} height={20}/></span>
                        </span>
                    </span>
                </span>
                {/* {errorMessage} */}
            </div>
        );
    }
}
