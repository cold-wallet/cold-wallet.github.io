import React from "react";

export class AssetCurrency extends React.Component {
    render() {
        return (
            <div>
                <span>{this.props.currency}</span>
            </div>
        );
    }
}