import React from 'react';
import { Plus, Edit, Trash } from 'react-bytesize-icons';
let latestVersion;


export default class ItemActions extends React.Component {

    constructor(props) {
        super();
    }

    onClick = (ev, method) => {
        ev.preventDefault();
        ev.stopPropagation();

        if(this.props.methods[method])
            this.props.methods[method]();
    }

    render() {
        return (
            <span className="item-actions">
                {this.props.mode === 'project' && (
                    <span className="item-action action-add" title={'Add new scratch'} onClick={(ev) => this.onClick(ev, 'add')}>
                        <span className="sidebar-icon"><Plus width={20} height={20}/></span>
                    </span>
                )}
                <span className="item-action action-remove" title={'Remove ' + this.props.mode} onClick={(ev) => this.onClick(ev, 'remove')}>
                    <span className="sidebar-icon"><Trash width={20} height={20}/></span>
                </span>
                <span className="item-action action-rename" title={'Rename ' + this.props.mode} onClick={(ev) => this.onClick(ev, 'rename')}>
                <span className="sidebar-icon"><Edit width={20} height={20}/></span>
                </span>
            </span>
        );
    }
}
