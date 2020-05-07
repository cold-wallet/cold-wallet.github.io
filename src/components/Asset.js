import React from "react";
import './Asset.css'

export class Asset extends React.Component {

    constructor(props, context) {
        super(props, context);
        this.state = {};
    }

    onNewAssetConfirmed() {
        if (this.state.isInvalid || !this.state.amount) {
            this.nameInput.focus();
            return
        }
        this.props.onAccepted(this.state.amount)
    }

    componentDidMount() {
        this.nameInput.focus();
    }

    checkIsInvalid({valueAsNumber}) {
        return !valueAsNumber
            || isNaN(valueAsNumber)
            || valueAsNumber <= 0
    }

    onDeleteAsset() {
        this.props.onDelete();
    }

    render() {
        return (
            <div className={this.props.isNewAsset ? "asset-item--active" : "asset-item"}>
                <div className={"asset-item-value"}>
                    <input
                        ref={(input) => {
                            this.nameInput = input;
                        }}
                        autoFocus
                        className={
                            "asset-item-value-input" +
                            (this.state.isInvalid ? " asset-item-value-input--invalid" : "")
                        }
                        type="number"
                        value={this.props.value}
                        disabled={!this.props.isNewAsset}
                        onInput={(event) => {
                            let target = event.target;

                            if (this.checkIsInvalid(target)) {
                                this.setState({
                                    isInvalid: true,
                                });
                                return
                            }

                            this.setState({
                                isInvalid: false,
                                amount: target.valueAsNumber,
                            });
                        }}
                    />
                </div>
                <div className={"asset-item-currency"}>
                    <span className={"asset-item-currency-name"}>{this.props.currencyCode}</span>
                </div>
                {
                    this.props.isNewAsset
                        ? <button
                            onClick={() => this.onNewAssetConfirmed()}
                            className={"accept-new-asset-button positive-button"}>✔</button>
                        : <button
                            onClick={event => this.onDeleteAsset()}
                            className={"delete-asset-button negative-button"}>✖</button>
                }
            </div>
        );
    }
}
