import React from "react";
import './AssetsGroup.css';
import './Asset.css'
import AssetDTO from "./AssetDTO";
import NumberFormat from "react-number-format";
import noExponents from "../extensions/noExponents";
import uuidGenerator from "../extensions/uuid-generator";
import assetsService from "../assets/AssetService";
import settingsRepository from "../repo/SettingsRepository";

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
                        title={"Add new asset"}
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
        let nameInput;
        const props = {
            key: "new-" + this.props.group.type,
            name: this.state.newAsset?.name || "",
            description: this.state.newAsset?.description || "",
            currencyCode: (this.state.newAsset?.currency)
                || buildTemplateAssetDTO(this.props.group.type).currency,
        };
        return <div key={props.key} className={"asset-item--active"}>
            <div className="asset-item--main-controls-row">
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
                        title={"accept"}
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
                                nameInput.value || props.name,
                                props.description,
                                this.state.newAsset.id,
                            ));
                        }}
                        className={"accept-new-asset-button positive-button button"}>✔</button>,
                    <button
                        key={"delete-asset-button"}
                        title={"delete"}
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
            <div className={"new-asset-menu--data-edit"} key={"inputs"}>
                <div><label>
                    <div className="new-asset-menu--data-name-input-label">Short name:</div>
                    <input
                        ref={instance => {
                            (nameInput = instance) && (nameInput.value = props.name);
                        }}
                        type="text"
                        className={"new-asset-menu--data-name-input"}/>
                </label></div>
            </div>
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
            onAccepted: ({amount, name, description}) => {
                asset.amount = amount;
                asset.name = name;
                asset.description = description;
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
            onEditCancelRequested: () => {
                delete asset.editModeEnabled;
                this.setState({
                    assets: this.state.assets,
                })
            },
        })).map(props => {
            let amount = props.asset.amount;
            let nameInput;
            return (
                <div translate="no" key={props.key} className={"asset-item"}>
                    <div className="asset-item--main-controls-row">
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
                                    amount = floatValue
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
                        {props.asset.isMonobankAsset && settingsRepository.getLatest().integrations.monobank.monobankIntegrationEnabled
                            ? <div title={"Monobank integration"}
                                   className={"asset-item-buttons-container--integration-name"}>monobank</div>
                            : <div className={"asset-item-buttons-container"}>{[
                                (props.editModeEnabled)
                                    ? <button
                                        key={"accept-new-asset-button"}
                                        title={"accept"}
                                        onClick={() => {
                                            if (this.checkIsInvalid(amount)) {
                                                props.enableInvalidMode();
                                                return;

                                            } else if (props.isInvalid) {
                                                props.disableInvalidMode();
                                            }

                                            props.onAccepted({
                                                amount: amount,
                                                name: nameInput.value,
                                            });
                                        }}
                                        className={"accept-new-asset-button positive-button button"}>✔</button>
                                    : <button
                                        key={"edit-asset-button"}
                                        title={"edit"}
                                        onClick={() => props.onEditRequested()}
                                        className={"edit-asset-button neutral-button pencil-icon button"}>🖉</button>,
                                (props.editModeEnabled)
                                    ? <button
                                        key={"cancel-editing-asset-button"}
                                        title={"cancel"}
                                        onClick={() => props.onEditCancelRequested()}
                                        className={"cancel-editing-asset-button neutral-button button"}>
                                        <img alt="discard changes"
                                             className="cancel-editing-asset-button--image"
                                             src="https://img.icons8.com/android/24/000000/cancel.png"/>
                                    </button>
                                    : <button
                                        key={"delete-asset-button"}
                                        title={"delete"}
                                        onClick={() => props.onDelete()}
                                        className={"delete-asset-button negative-button button"}>✖</button>
                            ]}</div>}
                    </div>
                    {
                        !props.editModeEnabled ? null :
                            <div className={"new-asset-menu--data-edit"} key={"inputs"}>
                                <div><label>
                                    <div className="new-asset-menu--data-name-input-label">Short name:</div>
                                    <input
                                        disabled={props.asset.isMonobankAsset ? "disabled" : ""}
                                        ref={instance => {
                                            nameInput = instance;
                                            if (nameInput) {
                                                nameInput.value = props.asset.name;
                                            }
                                        }}
                                        type="text"
                                        title={props.asset.isMonobankAsset
                                            ? "No custom name for external integration asset"
                                            : ""}
                                        className={"new-asset-menu--data-name-input" + (props.asset.isMonobankAsset
                                            ? " new-asset-menu--data-name-input__disabled"
                                            : "")}/>
                                </label></div>
                            </div>
                    }
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
