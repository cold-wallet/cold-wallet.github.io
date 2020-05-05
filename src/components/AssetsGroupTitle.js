import React from "react";
import './AssetsTitle.css'

export class AssetsGroupTitle extends React.Component {
    render() {
        return (
            <div className={"assets-title"}>{this.props.value}</div>
        );
    }
}