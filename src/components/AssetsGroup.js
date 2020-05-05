import React from "react";
import {Asset} from "./Asset";
import './AssetsGroup.css';

export class AssetsGroup extends React.Component {

    _onAddAssetButtonClick() {
        this.props.spawnMenu(this.props.group.type);
    }

    render() {
        return (
            <div className={"assets-group"}>
                <div className={"assets-title"}>{this.props.group.type}</div>
                <div className={"assets"}>{
                    this.props.group.assets.map((asset, i) =>
                        <Asset key={i}
                               value={asset.amount}
                               currency={asset.currency}
                        />
                    )
                }</div>
                <div className={"add-asset-button-wrapper"}>
                    <button className={"add-asset-button"}
                            onClick={() => this._onAddAssetButtonClick()}
                    >+
                    </button>
                </div>
            </div>
        );
    }
}
