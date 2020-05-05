import React from "react";
import {AssetValue} from "./AssetValue";
import {AssetCurrency} from "./AssetCurrency";
import './Asset.css'

export class Asset extends React.Component {
    render() {
        return (
            <div className={"asset-item"}>
                <AssetValue value={this.props.value}/>
                <AssetCurrency currency={this.props.currency}/>
            </div>
        );
    }
}
