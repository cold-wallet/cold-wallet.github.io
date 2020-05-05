import React from "react";
import './AssetCurrency.css'

export class AssetCurrency extends React.Component {
    render() {
        return (
            <div className={"asset-item-currency"}>
                <span className={"asset-item-currency-name"}>{this.props.currency}</span>
            </div>
        );
    }
}
