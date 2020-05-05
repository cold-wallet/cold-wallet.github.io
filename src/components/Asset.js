import React from "react";
import './Asset.css'

export class Asset extends React.Component {
    render() {
        return (
            <div className={"asset-item"}>
                <div className={"asset-item-value"}>
                    <input
                        className={"asset-item-value-input"}
                        type="number"
                        defaultValue={this.props.value}
                        disabled={true}
                    />
                </div>
                <div className={"asset-item-currency"}>
                    <span className={"asset-item-currency-name"}>{this.props.currency}</span>
                </div>
                <button className={"delete-asset-button"}>x</button>
            </div>
        );
    }
}
