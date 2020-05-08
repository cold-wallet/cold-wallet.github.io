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
        this.setState({
            newAsset: null
        });
        this.props.saveStateFunction();
    }

    onAssetFromTemplateAccepted(amount, currency) {
        this.props.group.assets.unshift(new AssetDTO(
            this.props.group.type,
            amount,
            currency
        ));
        this.props.saveStateFunction();
    }

    buildAssets() {
        return this.props.group.assets.map((asset, i) => {
                console.log("building asset:", asset);
                return <Asset key={i}
                              value={asset.amount}
                              currencyCode={asset.currency}
                              onAccepted={(amount) => {
                                  asset.amount = amount;
                                  this.props.saveStateFunction();
                              }}
                              onDelete={() => {
                                  this.props.group.assets = this.props.group.assets.filter(_asset => _asset !== asset);
                                  this.props.saveStateFunction();
                              }}
                />
            }
        );
    }

    buildNewAssetItem() {
        return <Asset key={"new"}
                      isNewAsset={true}
                      onAccepted={(amount) => {
                          this.onAccepted(amount);
                      }}
                      onDelete={() => {
                          this.setState({
                              newAsset: null
                          });
                      }}
                      currencyCode={this.state.newAsset.currency}
        />
    }

    buildTemplateAsset() {
        const asset = buildTemplateAssetDTO(this.props.group.type);
        return <Asset
            key={"template"}
            isTemplateAsset={true}
            value={asset.amount}
            currencyCode={asset.currency}
            onAccepted={(amount) => {
                this.onAssetFromTemplateAccepted(amount, asset.currency);
            }}
        />
    }

    buildCurrentOrDefaultAssets() {
        if (this.props.group.assets.length) {
            return this.buildAssets();
        }
        if (!this.state.newAsset) {
            return this.buildTemplateAsset();
        }
        return null;
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
