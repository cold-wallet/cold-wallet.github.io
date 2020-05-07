import React from "react";
import {Asset} from "./Asset";
import './AssetsGroup.css';
import AssetDTO from "./AssetDTO";

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
        this.props.group.assets.push(new AssetDTO(
            this.props.group.type,
            amount,
            this.state.newAsset.currency
        ));
        this.setState({
            newAsset: null
        });
    }

    render() {
        return (<div className={"assets-group"}>
            <div className={"assets-title"}>{this.props.group.type}</div>
            <div className={"assets"}>
                {
                    this.state.newAsset
                        ? <Asset isNewAsset={true}
                                 onAccepted={(amount) => {
                                     this.onAccepted(amount);
                                 }}
                                 currencyCode={this.state.newAsset.currency}
                        />
                        : null
                }
                {
                    this.props.group.assets.map((asset, i) =>
                        <Asset key={i}
                               value={asset.amount}
                               currencyCode={asset.currency}
                        />
                    )
                }
            </div>
            <div className={"add-asset-button-wrapper"}>
                <button className={"add-asset-button positive-button"}
                        onClick={() => this._onAddAssetButtonClick()}
                ><strong>+</strong>
                </button>
            </div>
        </div>);
    }
}
