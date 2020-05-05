import React from "react";
import {AssetsGroupTitle} from "./AssetsGroupTitle";
import {Asset} from "./Asset";
import './AssetsGroup.css';
import {AddAssetButton} from "./AddAssetButton";

export class AssetsGroup extends React.Component {
    render() {
        return (
            <div className={"assets-group"}>
                <AssetsGroupTitle value={this.props.group.type}/>
                <div className={"assets"}>{
                    this.props.group.assets.map((asset, i) =>
                        <Asset key={i} value={asset.amount} currency={asset.currency}/>
                    )
                }</div>
                <AddAssetButton/>
            </div>
        );
    }
}
