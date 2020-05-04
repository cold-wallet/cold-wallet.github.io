import React from "react";

export class Title extends React.Component {
    render() {
        return (
            <div>{this.props.value}</div>
        );
    }
}