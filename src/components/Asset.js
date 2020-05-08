import React from "react";
import './Asset.css'

export class Asset extends React.Component {

    constructor(props, context) {
        super(props, context);
        this.state = {
            amount: props.value
        };
    }

    onAssetStateSaveRequested() {
        if (this.state.isInvalid || !this.state.amount) {
            this.nameInput.focus();
            return
        }
        this.setState({editModeEnabled: false});
        this.props.onAccepted(this.state.amount)
    }

    componentDidMount() {
        this.nameInput.focus();
    }

    checkIsInvalid({valueAsNumber}) {
        return !valueAsNumber
            || isNaN(valueAsNumber)
            || (valueAsNumber <= 0)
    }

    onDeleteAsset() {
        this.setState({editModeEnabled: false});
        this.props.onDelete && this.props.onDelete();

        if (this.props.isTemplateAsset) {
            this.nameInput.value = "0";
        }
    }

    onEditAssetRequested() {
        this.setState({editModeEnabled: true});
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
                        disabled={!this.props.isNewAsset && !this.props.isTemplateAsset && !this.state.editModeEnabled}
                        onChange={(event) => {
                            let target = event.target;

                            if (this.checkIsInvalid(target)) {
                                this.setState({
                                    isInvalid: true,
                                });
                                return
                            }

                            if (target.valueAsNumber && (target.value[0] === '0')) {
                                target.value = target.value.slice(1);
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
                <div className={"asset-item-buttons-container"}>{[
                    (this.props.isNewAsset || this.props.isTemplateAsset || this.state.editModeEnabled)
                        ? <button
                            key={"accept-new-asset-button"}
                            onClick={() => this.onAssetStateSaveRequested()}
                            className={"accept-new-asset-button positive-button button"}>✔</button>
                        : null,
                    (this.props.isNewAsset || this.props.isTemplateAsset || this.state.editModeEnabled)
                        ? null
                        : <button
                            key={"edit-asset-button"}
                            onClick={() => this.onEditAssetRequested()}
                            className={"edit-asset-button neutral-button pencil-icon button"}>🖉</button>,
                    <button
                        key={"delete-asset-button"}
                        onClick={() => this.onDeleteAsset()}
                        className={"delete-asset-button negative-button button"}>✖</button>
                ]}</div>
            </div>
        );
    }
}
