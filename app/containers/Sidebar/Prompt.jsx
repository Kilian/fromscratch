import React from 'react';
import { Checkmark, Close } from 'react-bytesize-icons';
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
        if(ev.keyCode == 13 && this.state.validation.valid)
            this.onSubmit();
        else if(ev.keyCode === 27)
            this.onCancel();
    }

    render() {

        if (this.props.mode === 'input'){
            var input = (
                <input autoFocus className="prompt-input" type="text" value={this.inputValue} onChange={this.onInputChange} onKeyUp={this.handleKey}/>
            );

            var errorMessage = (
                <div className="prompt-error">{this.state.validation.message}</div>
            );
        } else {
            var input = (
                <span className="prompt-input-placeholder"></span>
            );
        }

        return (
            <div className={'prompt' + (this.state.validation.valid ? '' : ' invalid') + (this.props.indentLevel ? ' ' + this.props.indentLevel : '')}>
                <span className="prompt-label">{this.props.label}</span>
                {input}
                <span className="actions">
                    <span className="item-action" onClick={this.onSubmit}>
                        <span className="sidebar-icon"><Checkmark width={20} height={20}/></span>
                    </span>
                    <span className="item-action" onClick={this.onCancel}>
                        <span className="sidebar-icon" ><Close width={20} height={20}/></span>
                    </span>
                </span>
                {errorMessage}
            </div>

        );
    }
}
