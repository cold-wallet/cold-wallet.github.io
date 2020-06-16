import React from "react";
import './AssetsGroup.css';
import './Asset.css'
import AssetDTO from "./AssetDTO";
import NumberFormat from "react-number-format";
import noExponents from "../extensions/noExponents";
import uuidGenerator from "../extensions/uuid-generator";
import assetsService from "../assets/AssetService";

export class AssetsGroup extends React.Component {

    static defaultProps = {
        spawnMenu: ({onSettingsSet}) => false,
        saveStateFunction: () => false,
        group: {
            type: 'crypto',
            assets: [],
        },
    };

    state = {
        assets: this.props.group.assets,
    };

    render() {
        return <div className={"assets-group"}>
            <div className="assets-title" translate="no">{this.props.group.type} currency</div>
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

    componentDidMount() {
        assetsService.subscribeOnChange(assets => this.setState({
            assets: assets.assets[this.props.group.type].assets,
        }))
    }

    buildNewAssetIfNeeds() {
        return this.state.newAsset ? this.buildNewAssetItem() : null;
    }

    buildNewAssetItem() {
        const props = {
            key: "new-" + this.props.group.type,
            name: this.state.newAsset?.name || "",
            description: this.state.newAsset?.description || "",
            currencyCode: (this.state.newAsset?.currency)
                || buildTemplateAssetDTO(this.props.group.type).currency,
        };
        return <div key={props.key} className={"asset-item--active"}>
            <div className={"asset-item-value"}>
                <NumberFormat
                    allowNegative={false}
                    getInputRef={(input) => {
                        props.valueInput = input;
                        input && this.state.newAsset && input.focus();
                    }}
                    isNumericString={true}
                    displayType={"input"}
                    decimalScale={(this.props.group.type === "crypto") ? 8 : 2}
                    thousandSeparator={true}
                    defaultValue={(props.amount || props.value || "")}
                    onValueChange={(values) => {
                        const {floatValue} = values;
                        // {
                        //     formattedValue: '$23,234,235.56', //value after applying formatting
                        //     value: '23234235.56', //non formatted value as numeric string 23234235.56,
                        //     // if you are setting this value to state make sure to pass isNumericString prop to true
                        //     floatValue: 23234235.56 //floating point representation. For big numbers it
                        //     // can have exponential syntax
                        // }
                        props.valueAsNumber = floatValue
                    }}
                    renderText={value => <div className={
                        "asset-item-value-input" +
                        (this.state.newAsset?.isInvalid ? " asset-item-value-input--invalid" : "")
                    }>{value}</div>}
                />
            </div>
            <div className={"asset-item-currency"}>
                <span translate="no" className={"asset-item-currency-name"}>{props.currencyCode}</span>
            </div>
            <div className={"asset-item-buttons-container"}>{[
                <button
                    key={"accept-new-asset-button"}
                    onClick={() => {
                        if (this.checkIsInvalid(props.valueAsNumber)) {
                            const newAsset = this.state.newAsset
                                || (() => buildTemplateAssetDTO(this.props.group.type))();
                            newAsset.isInvalid = true;
                            this.setState({newAsset: newAsset});
                            props.valueInput.focus();
                            return;
                        }
                        this.addAsset(new AssetDTO(
                            this.props.group.type,
                            props.valueAsNumber,
                            props.currencyCode,
                            props.name,
                            props.description,
                            this.state.newAsset.id,
                        ));
                    }}
                    className={"accept-new-asset-button positive-button button"}>✔</button>,
                <button
                    key={"delete-asset-button"}
                    onClick={() => {
                        props.valueInput.value = "";
                        props.valueAsNumber = 0;
                        props.valueInput.focus();
                        this.setState({
                            newAsset: null
                        });
                    }}
                    className={"delete-asset-button negative-button button"}>✖</button>
            ]}</div>
        </div>
    }

    checkIsInvalid(valueAsNumber) {
        return !valueAsNumber
            || isNaN(valueAsNumber)
            || (valueAsNumber <= 0)
    }

    addAsset(asset) {
        const assets = [asset].concat(this.props.group.assets);
        this.setState({
            newAsset: null,
            assets,
        });
        this.props.saveStateFunction(assets);
    }

    buildAssets() {
        return this.state.assets.map((asset, i) => ({
            key: i,
            asset,
            value: asset.amount,
            currencyCode: asset.currency,
            onAccepted: (amount) => {
                asset.amount = amount;
                delete asset.editModeEnabled;
                const assets = this.state.assets;
                assets[i] = asset;
                this.props.saveStateFunction(assets);
                this.setState({assets: assets});
            },
            isInvalid: asset.isInvalid,
            enableInvalidMode: () => {
                asset.isInvalid = true;
                this.setState({assets: this.state.assets});
            },
            disableInvalidMode: () => {
                delete asset.isInvalid;
                this.setState({assets: this.state.assets});
            },
            onDelete: () => {
                const assets = this.state.assets.filter(_asset => _asset !== asset);
                this.props.saveStateFunction(assets);
                this.setState({assets: assets});
            },
            editModeEnabled: asset.editModeEnabled,
            onEditRequested: () => {
                asset.editModeEnabled = true;
                this.setState({
                    assets: this.state.assets,
                })
            },
        })).map(props => {
            const _state = {
                valueInput: {
                    valueAsNumber: props.asset.amount,
                }
            };
            return (
                <div translate="no" key={props.key} className={"asset-item"}>
                    <div className={"asset-item-value"}>
                        <NumberFormat
                            allowNegative={false}
                            getInputRef={(input) => {
                                input && input.focus();
                            }}
                            isNumericString={true}
                            displayType={props.editModeEnabled ? "input" : "text"}
                            decimalScale={(props.asset.type === "crypto") ? 8 : 2}
                            thousandSeparator={true}
                            disabled={!props.editModeEnabled}
                            value={noExponents(props.asset.amount)}
                            onValueChange={(values) => {
                                const {floatValue} = values;
                                // {
                                //     formattedValue: '$23,234,235.56', //value after applying formatting
                                //     value: '23234235.56', //non formatted value as numeric string 23234235.56,
                                //     // if you are setting this value to state make sure to pass isNumericString prop to true
                                //     floatValue: 23234235.56 //floating point representation. For big numbers it
                                //     // can have exponential syntax
                                // }
                                _state.valueInput.valueAsNumber = floatValue
                            }}
                            renderText={value => <div className={
                                "asset-item-value-input" +
                                (props.isInvalid ? " asset-item-value-input--invalid" : "")
                            }>{value}</div>}
                        />
                    </div>
                    <div className={"asset-item-currency"}>
                        <span translate="no" className={"asset-item-currency-name"}>{props.currencyCode}</span>
                    </div>
                    <div className={"asset-item-buttons-container"}>{[
                        (props.editModeEnabled)
                            ? <button
                                key={"accept-new-asset-button"}
                                onClick={() => {
                                    if (this.checkIsInvalid(_state.valueInput.valueAsNumber)) {
                                        props.enableInvalidMode();
                                        return;

                                    } else if (props.isInvalid) {
                                        props.disableInvalidMode();
                                    }

                                    props.onAccepted(_state.valueInput.valueAsNumber);
                                }}
                                className={"accept-new-asset-button positive-button button"}>✔</button>
                            : <button
                                key={"edit-asset-button"}
                                onClick={() => props.onEditRequested()}
                                className={"edit-asset-button neutral-button pencil-icon button"}>🖉</button>,
                        <button
                            key={"delete-asset-button"}
                            onClick={() => props.onDelete()}
                            className={"delete-asset-button negative-button button"}>✖</button>
                    ]}</div>
                </div>
            )
        })
    }

    buildCurrentOrDefaultAssets() {
        return this.state.assets.length ? this.buildAssets() : null;
    }

    _onAddAssetButtonClick() {
        this.props.spawnMenu({
            onSettingsSet: settings => {
                this.setState({
                    newAsset: {
                        id: settings.id || generateNewAssetId(),
                        currency: settings.currencyCode,
                        name: settings.name,
                        description: settings.description,
                    }
                })
            }
        });
    }
}

function buildTemplateAssetDTO(type) {
    return new AssetDTO(type, 0, "");
}

function generateNewAssetId() {
    return uuidGenerator.generateUUID();
}
