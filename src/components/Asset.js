import React from "react";
import {AssetValue} from "./AssetValue";
import {AssetCurrency} from "./AssetCurrency";

export class Asset extends React.Component {
    render() {
        return (
            <div>
                <AssetValue value={this.props.value}/>
                <AssetCurrency currency={this.props.currency}/>
            </div>
        );
    }
}