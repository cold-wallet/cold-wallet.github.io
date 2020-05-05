import React from "react";
import {Asset} from "./Asset";
import './AssetsGroup.css';

export class AssetsGroup extends React.Component {
    render() {
        return (
            <div className={"assets-group"}>
                <div className={"assets-title"}>{this.props.group.type}</div>
                <div className={"assets"}>{
                    this.props.group.assets.map((asset, i) =>
                        <Asset key={i} value={asset.amount} currency={asset.currency}/>
                    )
                }</div>
                <div className={"add-asset-button-wrapper"}>
                    <button className={"add-asset-button"}>+</button>
                </div>
            </div>
        );
    }
}
