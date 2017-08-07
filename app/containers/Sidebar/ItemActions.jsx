import React from 'react';
import Ionicon from 'react-ionicons'
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
