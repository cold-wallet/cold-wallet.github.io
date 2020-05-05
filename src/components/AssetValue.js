import React from "react";
import './AssetValue.css'

export class AssetValue extends React.Component {
    render() {
        return (
            <div className={"asset-item-value"}>
                <input
                    className={"asset-item-value-input"}
                    type="number"
                    defaultValue={this.props.value}
                    disabled={true}
                />
            </div>
        );
    }
}
