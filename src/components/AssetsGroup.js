import React from "react";
import {AssetsGroupTitle} from "./AssetsGroupTitle";
import {Asset} from "./Asset";
import './AssetsGroup.css';
import {AddAssetButton} from "./AddAssetButton";

function getDefaultCurrency(type) {
    switch (type) {
        case "crypto":
            return "BTC";
        case "cash":
        case "non-cash":
        default:
            return "USD";
    }
}

export class AssetsGroup extends React.Component {
    render() {
        return (
            <div className={"assets-group"}>
                <AssetsGroupTitle value={this.props.type}/>
                <div className={"assets"}>
                    <Asset value={0} currency={getDefaultCurrency(this.props.type)}/>
                </div>
                <AddAssetButton/>
            </div>
        );
    }
}
