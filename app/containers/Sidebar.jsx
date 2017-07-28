import React from 'react';



const electron = require('electron');
const ipc = electron.ipcRenderer;
const remote = electron.remote;
const shell = electron.shell;
const handleContent = remote.getGlobal('handleContent');
const nodeStorage = remote.getGlobal('nodeStorage');
const projects = remote.getGlobal('projects');
let latestVersion;



export default class Sidebar extends React.Component {

    constructor(props) {
        super();

        this.state = {
        };

        projects.refreshProjectsTree();




    }


    onClickScratch(ev, scratchName){
        console.log('selecting scratch: ', scratchName);

        projects.setCurrentScratch(scratchName);

        // HOW TO GET FROM SCRATCH COMPONENT TO RERENDER WITH CHANGED DIRECTORY?

    }


    render(){
        var self = this;

        let menuItems = Object.entries(projects.tree).map((item, i) => {
            let projectName = item[0];
            let scratches = item[1].map(s => (<div className="file" onClick={ev => self.onClickScratch(ev, s)}>{s}</div>));
            return (
                <div className="folder">
                    <div className="folder-label">{projectName}</div>
                    {scratches}
                </div>
            );
        });


        return(
            <div className="sidebar">

                <div className="sidebar-controls">
                    <div className="control" id="new-project">new</div>
                </div>

                <div className="sidebar-tree">
                    {menuItems}
                </div>

            </div>
        );
    }

}
