import React from "react";

export class AssetValue extends React.Component {
    render() {
        return (
            <div>
                <input type="text" defaultValue={this.props.value}/>
            </div>
        );
    }
}