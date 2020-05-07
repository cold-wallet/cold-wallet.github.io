import React from "react";
import {Asset} from "./Asset";
import './AssetsGroup.css';
import AssetDTO from "./AssetDTO";

function buildTemplateAssetDTO(type) {
    return buildDefaultState(type).assets[0];
}

function buildDefaultState(type) {
    return {
        cash: {
            type: 'cash',
            assets: [new AssetDTO('cash', 0, "USD")],
        },
        "non-cash": {
            type: 'non-cash',
            assets: [new AssetDTO('non-cash', 0, "USD")],
        },
        crypto: {
            type: 'crypto',
            assets: [new AssetDTO('crypto', 0, "BTC")],
        },
    }[type]
}

export class AssetsGroup extends React.Component {

    constructor(props, context) {
        super(props, context);
        this.state = {};
    }

    _onAddAssetButtonClick() {
        this.props.spawnMenu({
            onCurrencySelected: currency => {
                this.setState({
                    newAsset: {
                        currency: currency
                    }
                })
            }
        });
    }

    onAccepted(amount) {
        this.props.group.assets.unshift(new AssetDTO(
            this.props.group.type,
            amount,
            this.state.newAsset.currency
        ));
        this.props.saveStateFunction();
        this.setState({
            newAsset: null
        });
    }

    buildNewAssetItem() {
        return <Asset key={"new"}
                      isNewAsset={true}
                      onAccepted={(amount) => {
                          this.onAccepted(amount);
                      }}
                      currencyCode={this.state.newAsset.currency}
        />
    }

    buildAssets() {
        return this.props.group.assets.map((asset, i) =>
            <Asset key={i}
                   value={asset.amount}
                   currencyCode={asset.currency}
                   onDelete={() => {
                       this.props.group.assets = this.props.group.assets.filter(_asset => _asset !== asset);
                       this.props.saveStateFunction();
                   }}
            />
        );
    }

    buildTemplateAsset() {
        const asset = buildTemplateAssetDTO(this.props.group.type);
        return <Asset
            key={"template"}
            value={asset.amount}
            currencyCode={asset.currency}
            onDelete={() => console.log("vote for this feature")}
        />
    }

    buildCurrentOrDefaultAssets() {
        return this.props.group.assets.length ? this.buildAssets() : this.buildTemplateAsset();
    }

    buildNewAssetIfNeeds() {
        return this.state.newAsset ? this.buildNewAssetItem() : null;
    }

    render() {
        return <div className={"assets-group"}>
            <div className={"assets-title"}>{this.props.group.type}</div>
            <div className={"assets"}>{[
                this.buildNewAssetIfNeeds(),
                this.buildCurrentOrDefaultAssets(),
            ]}
            </div>
            <div className={"add-asset-button-wrapper"}>
                <button className={"add-asset-button positive-button"}
                        onClick={() => this._onAddAssetButtonClick()}
                ><strong>+</strong>
                </button>
            </div>
        </div>;
    }
}
