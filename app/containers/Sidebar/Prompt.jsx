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

    handleKey = (ev) => {
        if(ev.keyCode == 13 && this.state.validation.valid)
            this.onSubmit();
        else if(ev.keyCode === 27)
            this.onCancel();
    }

    render() {
        if(!this.props.show) return null;

        if (this.props.mode === 'input'){
            var input = (
                <div className="prompt-input-wrapper">
                    <input autoFocus className="prompt-input" type="text" value={this.inputValue} onChange={this.onInputChange} onKeyUp={this.handleKey}/>
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
                        <span className="sidebar-icon"><Checkmark width={20} height={20}/></span>
                        {this.props.textData.submitDesc}
                    </div>
                    <div className="prompt-button cancel" onClick={this.onCancel}>
                        <span className="sidebar-icon"><Close width={20} height={20}/></span>
                        {this.props.textData.cancelDesc}
                    </div>
                </div>
            </div>
        );
    }
}
