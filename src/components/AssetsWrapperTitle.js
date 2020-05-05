import React from "react";
import './AssetsWrapperTitle.css'

export class AssetsWrapperTitle extends React.Component {
    render() {
        return (
            <div className={"assets-wrapper-title"}>{this.props.value}</div>
        );
    }
}
