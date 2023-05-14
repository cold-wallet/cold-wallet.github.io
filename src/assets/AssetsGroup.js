import React from "react";
import './AssetsGroup.css';
import './Asset.css'
import AssetDTO from "./AssetDTO";
import NumberFormat from "react-number-format";
import noExponents from "../extensions/noExponents";
import uuidGenerator from "../extensions/uuid-generator";
import assetsService from "../assets/AssetService";
import settingsRepository from "../settings/SettingsRepository";
import monobankLogo from "../resources/img/monobank-logo-192x192.png";
import binanceLogo from "../resources/img/binance-logo.png";

export default class AssetsGroup extends React.Component {

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
                    <span translate="no"
                          title={props.name}
                          className={"asset-item-currency-name asset-item-name"}>{props.currencyCode}</span>
                </div>
                <div className={"asset-item-buttons-container asset-item-buttons-container--edit-mode"}>{[
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
        const amount = asset.amount;
        asset.amount = 0;
        const assets = [asset].concat(this.props.group.assets);
        this.setState({
            newAsset: null,
            assets,
        }, () => {
            this.props.saveStateFunction(assets);
            asset.amount = amount;
            this.setState({
                newAsset: null,
                assets,
            });
            this.props.saveStateFunction(assets);
        });
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
                asset.amount = 0;
                this.props.saveStateFunction(this.state.assets);
                this.setState({assets: this.state.assets});

                const assetsClear = this.state.assets.filter(_asset => _asset !== asset);
                this.props.saveStateFunction(assetsClear);
                this.setState({assets: assetsClear});
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
            deleteModeEnabled: asset.deleteModeEnabled,
            enableDeleteMode: () => {
                asset.deleteModeEnabled = true;
                this.setState({
                    assets: this.state.assets,
                })
            },
            disableDeleteMode: () => {
                delete asset.deleteModeEnabled;
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
                                renderText={value => <div title={value} className={
                                    "asset-item-value-input" +
                                    (props.isInvalid ? " asset-item-value-input--invalid" : "")
                                }>{value}</div>}
                            />
                        </div>
                        <div className={"asset-item-name--container"}>
                            <span translate="no"
                                  title={props.asset.description || props.asset.name}
                                  className={"asset-item-name"}>{props.asset.name}</span>
                        </div>
                        {props.asset.isMonobankAsset && settingsRepository.getLatest().integrations.monobank.monobankIntegrationEnabled
                            ? <div title={"Monobank integration"}
                                   className={"asset-item-buttons-container--integration-logo--wide asset-item-buttons-container--integration-logo--monobank"}>
                                <svg className="asset-item-buttons-container--integration-name" viewBox="0 0 116 25">
                                    <g>
                                        <path
                                            d="M17.96 17V8.624c0-2.376-1.272-3.504-3.408-3.504-1.776 0-3.312 1.056-3.984 2.112-.432-1.32-1.512-2.112-3.216-2.112-1.776 0-3.312 1.104-3.792 1.8V5.408H.512V17H3.56V9.2c.456-.648 1.344-1.368 2.4-1.368 1.248 0 1.728.768 1.728 1.848V17h3.072V9.176c.432-.624 1.32-1.344 2.4-1.344 1.248 0 1.728.768 1.728 1.848V17h3.072zm8.376.288c-3.816 0-6.12-2.784-6.12-6.096 0-3.288 2.304-6.072 6.12-6.072 3.84 0 6.144 2.784 6.144 6.072 0 3.312-2.304 6.096-6.144 6.096zm0-2.712c1.896 0 2.976-1.56 2.976-3.384 0-1.8-1.08-3.36-2.976-3.36s-2.952 1.56-2.952 3.36c0 1.824 1.056 3.384 2.952 3.384zM45.608 17V8.816c0-2.256-1.224-3.696-3.768-3.696-1.896 0-3.312.912-4.056 1.8V5.408h-3.048V17h3.048V9.2c.504-.696 1.44-1.368 2.64-1.368 1.296 0 2.136.552 2.136 2.16V17h3.048zm8.4.288c-3.816 0-6.12-2.784-6.12-6.096 0-3.288 2.304-6.072 6.12-6.072 3.84 0 6.144 2.784 6.144 6.072 0 3.312-2.304 6.096-6.144 6.096zm0-2.712c1.896 0 2.976-1.56 2.976-3.384 0-1.8-1.08-3.36-2.976-3.36s-2.952 1.56-2.952 3.36c0 1.824 1.056 3.384 2.952 3.384zm11.448-1.296c.504.744 1.632 1.296 2.616 1.296 1.776 0 2.952-1.344 2.952-3.36s-1.176-3.384-2.952-3.384c-.984 0-2.112.576-2.616 1.344v4.104zm0 3.72h-3.048V.992h3.048v5.904c.912-1.176 2.208-1.776 3.576-1.776 2.952 0 5.136 2.304 5.136 6.096 0 3.864-2.208 6.072-5.136 6.072-1.392 0-2.664-.624-3.576-1.776V17zm21.024 0h-3.048v-1.2c-.792.936-2.16 1.488-3.672 1.488-1.848 0-4.032-1.248-4.032-3.84 0-2.712 2.184-3.744 4.032-3.744 1.536 0 2.904.504 3.672 1.416V9.56c0-1.176-1.008-1.944-2.544-1.944-1.248 0-2.4.456-3.384 1.368l-1.152-2.04c1.416-1.248 3.24-1.824 5.064-1.824 2.64 0 5.064 1.056 5.064 4.392V17zm-5.496-1.776c.984 0 1.944-.336 2.448-1.008v-1.44c-.504-.672-1.464-1.008-2.448-1.008-1.2 0-2.184.624-2.184 1.752 0 1.08.984 1.704 2.184 1.704zM100.376 17V8.816c0-2.256-1.224-3.696-3.768-3.696-1.896 0-3.312.912-4.056 1.8V5.408h-3.048V17h3.048V9.2c.504-.696 1.44-1.368 2.64-1.368 1.296 0 2.136.552 2.136 2.16V17h3.048zm14.352 0L110 10.664l4.584-5.256h-3.744l-4.392 5.16V.992H103.4V17h3.048v-2.976l1.392-1.488L110.912 17h3.816z"></path>
                                    </g>
                                </svg>
                                <div className={"asset-item-buttons-container--integration-logo--container"}>
                                    <img alt="monobank logo"
                                         className={"asset-item-buttons-container--integration-logo--short"}
                                         src={monobankLogo}/>
                                </div>
                            </div>
                            : (props.asset.isBinanceAsset && settingsRepository.getLatest().integrations
                                .binance.binanceIntegrationEnabled)
                                ? <div title={"Binance integration"}
                                       className={"asset-item-buttons-container--integration-logo--wide asset-item-buttons-container--integration-logo--binance"}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5120 1024"
                                         className={"asset-item-buttons-container--integration-name css-tsyi71"}>
                                        <path
                                            d="M230.997333 512L116.053333 626.986667 0 512l116.010667-116.010667L230.997333 512zM512 230.997333l197.973333 197.973334 116.053334-115.968L512 0 197.973333 314.026667l116.053334 115.968L512 230.997333z m395.989333 164.992L793.002667 512l116.010666 116.010667L1024.981333 512l-116.992-116.010667zM512 793.002667l-197.973333-198.997334-116.053334 116.010667L512 1024l314.026667-314.026667-116.053334-115.968L512 793.002667z m0-165.973334l116.010667-116.053333L512 396.032 395.989333 512 512 626.986667z m1220.010667 11.946667v-1.962667c0-75.008-40.021333-113.024-105.002667-138.026666 39.978667-21.973333 73.984-58.026667 73.984-121.002667v-1.962667c0-88.021333-70.997333-145.024-185.002667-145.024h-260.992v561.024h267.008c126.976 0.981333 210.005333-51.029333 210.005334-153.002666z m-154.026667-239.957333c0 41.984-34.005333 58.965333-89.002667 58.965333h-113.962666V338.986667h121.984c52.010667 0 80.981333 20.992 80.981333 58.026666v2.005334z m31.018667 224c0 41.984-32.981333 61.013333-87.04 61.013333h-146.944v-123.050667h142.976c63.018667 0 91.008 23.04 91.008 61.013334v1.024z m381.994666 169.984V230.997333h-123.989333v561.024h123.989333v0.981334z m664.021334 0V230.997333h-122.026667v346.026667l-262.997333-346.026667h-114.005334v561.024h122.026667v-356.010666l272 356.992h104.96z m683.946666 0L3098.026667 228.010667h-113.962667l-241.024 564.992h127.018667l50.986666-125.994667h237.013334l50.986666 125.994667h130.005334z m-224.981333-235.008h-148.992l75.008-181.973334 73.984 181.973334z m814.037333 235.008V230.997333h-122.026666v346.026667l-262.997334-346.026667h-114.005333v561.024h122.026667v-356.010666l272 356.992h104.96z m636.970667-91.008l-78.976-78.976c-44.032 39.978667-83.029333 65.962667-148.010667 65.962666-96 0-162.986667-80-162.986666-176v-2.986666c0-96 67.968-174.976 162.986666-174.976 55.978667 0 100.010667 23.978667 144 62.976l78.976-91.008c-51.968-50.986667-114.986667-86.997333-220.970666-86.997334-171.989333 0-292.992 130.986667-292.992 290.005334V512c0 160.981333 122.965333 288.981333 288 288.981333 107.989333 1.024 171.989333-36.992 229.973333-98.986666z m527.018667 91.008v-109.994667h-305.024v-118.016h265.002666v-109.994667h-265.002666V340.992h301.013333V230.997333h-422.997333v561.024h427.008v0.981334z"
                                            p-id="2935"></path>
                                    </svg>
                                    <div className={"asset-item-buttons-container--integration-logo--container"}>
                                        <img alt="binance logo"
                                             className={"asset-item-buttons-container--integration-logo--short"}
                                             src={binanceLogo}/>
                                    </div>
                                </div>
                                : <div className={"asset-item-buttons-container" + (props.editModeEnabled
                                    ? " asset-item-buttons-container--edit-mode" : "")}>{[
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
                                            className={"edit-asset-button neutral-button pencil-icon button"}>✎</button>,
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
                                            onClick={() => props.enableDeleteMode()}
                                            className={"delete-asset-button negative-button button"}>✖</button>,
                                    (props.editModeEnabled) ? null
                                        : <button className={"asset-item-buttons-placeholder neutral-button button"}>⫶</button>,
                                    (props.deleteModeEnabled) ? (
                                        <div className={"delete-asset-confirm--container"}>
                                            <div className="delete-asset-confirm--shadow" onClick={event => props.disableDeleteMode()}/>
                                            <div className="delete-asset-confirm--window">
                                                <span className="delete-asset-confirm--message">Delete {props.asset.amount} {props.asset.name}?</span>
                                                <div className="delete-asset-confirm--controls">
                                                    <button
                                                        key={"delete-asset-button"}
                                                        title={"Yes"}
                                                        onClick={() => props.onDelete()}
                                                        className={"confirm-delete-asset-button positive-button button"}>✔</button>
                                                    <button
                                                        key={"delete-asset-button"}
                                                        title={"Cancel"}
                                                        onClick={() => props.disableDeleteMode()}
                                                        className={"confirm-delete-asset-button neutral-button button"}>✖</button>
                                                </div>
                                            </div>
                                        </div>)
                                        : null
                                ]}</div>}
                    </div>
                    {
                        !props.editModeEnabled ? null :
                            <div className={"new-asset-menu--data-edit"} key={"inputs"}>
                                <div><label>
                                    <div className="new-asset-menu--data-name-input-label">Short name:</div>
                                    <input
                                        disabled={props.asset.isMonobankAsset || props.asset.isBinanceAsset
                                            ? "disabled" : ""}
                                        ref={instance => {
                                            nameInput = instance;
                                            if (nameInput) {
                                                nameInput.value = props.asset.name;
                                            }
                                        }}
                                        type="text"
                                        title={props.asset.isMonobankAsset || props.asset.isBinanceAsset
                                            ? "No custom name for external integration asset"
                                            : ""}
                                        className={"new-asset-menu--data-name-input" + (
                                            props.asset.isMonobankAsset || props.asset.isBinanceAsset
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
