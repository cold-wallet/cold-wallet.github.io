import * as React from "react";
import './Settings.css'
import settingsRepository from "../settings/SettingsRepository";
import monobankApiClient from "../integration/monobank/monobankApiClient";
import monobankUserDataRepository from "../integration/monobank/MonobankUserDataRepository";
import binanceUserDataRepository from "../integration/binance/BinanceUserDataRepository";
import LocalStorageRepository from "../extensions/LocalStorageRepository";
import binanceApiClient from "../integration/binance/binanceApiClient";
import assetsRepository from "../assets/assetsRepository";

const binanceLocker = LocalStorageRepository.builder()
    .name('binance-locker')
    .nullObject({})
    .build();

const monobankLocker = LocalStorageRepository.builder()
    .name('monobank-locker')
    .nullObject({})
    .build();

export default class Settings extends React.Component {

    constructor(props, context) {
        super(props, context);
        const currentSettings = settingsRepository.getLatest();
        this.state = {
            settingsWindowRequested: false,
            monobankIntegrationEnabled: currentSettings.integrations.monobank?.monobankIntegrationEnabled,
            monobankIntegrationToken: currentSettings.integrations.monobank?.monobankIntegrationToken,
            binanceIntegrationEnabled: currentSettings.integrations.binance?.binanceIntegrationEnabled,
            binanceKeyIntegrationToken: currentSettings.integrations.binance?.binanceKeyIntegrationToken,
            binanceSecretIntegrationToken: currentSettings.integrations.binance?.binanceSecretIntegrationToken,
        };
    }

    async componentDidMount() {
        if (!this.state.saveSettingsRequested
            && this.state.monobankIntegrationEnabled
            && this.state.monobankIntegrationToken
        ) {
            let response;
            try {
                response = await monobankApiClient.getUserInfoAsync(this.state.monobankIntegrationToken);
            } catch (e) {
                console.error(e)
            }
            let userInfo;
            if (response
                && (response.status === 200)
                && (userInfo = response.data)
                && !userInfo.errorDescription
                && userInfo.name
                && userInfo.accounts
            ) {
                monobankUserDataRepository.save({
                    clientId: userInfo.clientId,
                    name: userInfo.name,
                    accounts: userInfo.accounts,
                });
            } else {
                console.warn("Fetching latest rates failed", response);
            }

        }
        if (!this.state.saveSettingsRequested
            && this.state.binanceIntegrationEnabled
            && this.state.binanceKeyIntegrationToken
            && this.state.binanceSecretIntegrationToken
        ) {
            const filterEmptyBalances = (balances) => {
                return balances.filter(balance => (+balance.free) + (+balance.locked))
            }
            binanceApiClient
                .getUserInfoAsync(
                    this.state.binanceKeyIntegrationToken, this.state.binanceSecretIntegrationToken
                )
                .then(userInfo => {
                    let accounts = binanceUserDataRepository.getLatest()?.accounts || {};
                    let data = {
                        accountType: userInfo.accountType, // "SPOT",
                        balances: filterEmptyBalances(userInfo.balances), // [{asset,free,locked}],
                        buyerCommission: userInfo.buyerCommission, // 0,
                        canDeposit: userInfo.canDeposit, // true,
                        canTrade: userInfo.canTrade, // true,
                        canWithdraw: userInfo.canWithdraw, // true,
                        makerCommission: userInfo.makerCommission, // 10,
                        permissions: userInfo.permissions, // ["SPOT", "LEVERAGED"],
                        sellerCommission: userInfo.sellerCommission, // 0,
                        takerCommission: userInfo.takerCommission, // 10,
                        updateTime: userInfo.updateTime, // 1613192140017
                        accounts: accounts,
                    };
                    if (userInfo.accounts.marginIsolated) {
                        data.accounts.marginIsolated = userInfo.accounts.marginIsolated
                    }
                    if (userInfo.accounts.marginCross) {
                        data.accounts.marginCross = userInfo.accounts.marginCross
                    }
                    if (userInfo.accounts.futuresUsdM) {
                        data.accounts.futuresUsdM = userInfo.accounts.futuresUsdM
                    }
                    if (userInfo.accounts.futuresCoinM) {
                        data.accounts.futuresCoinM = userInfo.accounts.futuresCoinM
                    }
                    if (userInfo.accounts.funding) {
                        data.accounts.funding = userInfo.accounts.funding
                    }
                    if (userInfo.accounts.lockedStaking) {
                        data.accounts.lockedStaking = userInfo.accounts.lockedStaking
                    }
                    if (userInfo.accounts.lockedDeFiStaking) {
                        data.accounts.lockedDeFiStaking = userInfo.accounts.lockedDeFiStaking
                    }
                    if (userInfo.accounts.flexibleDefiStaking) {
                        data.accounts.flexibleDefiStaking = userInfo.accounts.flexibleDefiStaking
                    }
                    if (userInfo.accounts.liquidityFarming) {
                        data.accounts.liquidityFarming = userInfo.accounts.liquidityFarming
                    }
                    if (userInfo.accounts.savingsFixed) {
                        data.accounts.savingsFixed = userInfo.accounts.savingsFixed
                    }
                    if (userInfo.accounts.savingsFlexible) {
                        data.accounts.savingsFlexible = userInfo.accounts.savingsFlexible
                    }
                    binanceUserDataRepository.save(data);
                    return data
                })
                .catch(console.error)
        }
    }

    switchState() {
        this.setState({
            settingsWindowRequested: !this.state.settingsWindowRequested,
        })
    }

    saveBinanceSettings(settings) {
        const latest = settingsRepository.getLatest();
        latest.integrations.binance = {
            binanceIntegrationEnabled: settings.binanceIntegrationEnabled,
            binanceKeyIntegrationToken: settings.binanceKeyIntegrationToken,
            binanceSecretIntegrationToken: settings.binanceSecretIntegrationToken,
        };
        settingsRepository.save(latest);

        binanceUserDataRepository.save(settings.binanceIntegrationEnabled ? {
            accountType: settings.accountType,
            balances: settings.balances,
            buyerCommission: settings.buyerCommission,
            canDeposit: settings.canDeposit,
            canTrade: settings.canTrade,
            canWithdraw: settings.canWithdraw,
            makerCommission: settings.makerCommission,
            permissions: settings.permissions,
            sellerCommission: settings.sellerCommission,
            takerCommission: settings.takerCommission,
            updateTime: settings.updateTime,
        } : {});

        this.setState({
            saveSettingsRequested: false,
            settingsWindowRequested: false,
            bufferBinanceKeyIntegrationToken: undefined,
            bufferBinanceSecretIntegrationToken: undefined,
            binanceIntegrationEnabled: settings.binanceIntegrationEnabled,
            binanceKeyIntegrationToken: settings.binanceKeyIntegrationToken,
            binanceSecretIntegrationToken: settings.binanceSecretIntegrationToken,
        }, () => binanceLocker.save({}));
    }

    saveMonobankSettings(settings) {
        const latest = settingsRepository.getLatest();
        latest.integrations.monobank = {
            monobankIntegrationEnabled: settings.monobankIntegrationEnabled,
            monobankIntegrationToken: settings.monobankIntegrationToken,
        };
        settingsRepository.save(latest);

        monobankUserDataRepository.save(settings.monobankIntegrationEnabled ? {
            clientId: settings.clientId,
            name: settings.name,
            accounts: settings.accounts,
        } : {});

        this.setState({
            saveSettingsRequested: false,
            settingsWindowRequested: false,
            bufferMonobankIntegrationToken: undefined,
            monobankIntegrationEnabled: settings.monobankIntegrationEnabled,
            monobankIntegrationToken: settings.monobankIntegrationToken,
        }, () => monobankLocker.save({}));
    }

    render() {
        const bufferMonobankIntegrationToken = this.state.bufferMonobankIntegrationToken;
        const bufferBinanceKeyIntegrationToken = this.state.bufferBinanceKeyIntegrationToken;
        const bufferBinanceSecretIntegrationToken = this.state.bufferBinanceSecretIntegrationToken;

        if (this.state.saveSettingsRequested
            && this.state.monobankIntegrationEnabled
            && bufferMonobankIntegrationToken
            && !monobankLocker.getLatest().monobankIntegrationLock
        ) {
            monobankLocker.save({
                monobankIntegrationLock: Date.now(),
            });
            try {
                monobankApiClient.getUserInfo(
                    bufferMonobankIntegrationToken,
                    userInfo => {
                        this.saveMonobankSettings({
                            clientId: userInfo.clientId,
                            name: userInfo.name,
                            accounts: userInfo.accounts,
                            monobankIntegrationEnabled: this.state.monobankIntegrationEnabled,
                            monobankIntegrationToken: bufferMonobankIntegrationToken
                        });
                    },
                    e => {
                        console.error(e);
                        this.setState({
                            saveSettingsRequested: false,
                        });
                        monobankLocker.save({});
                    });
            } catch (e) {
                monobankLocker.save({});
            }
        }

        if (this.state.saveSettingsRequested
            && this.state.binanceIntegrationEnabled
            && bufferBinanceKeyIntegrationToken
            && bufferBinanceSecretIntegrationToken
            && !binanceLocker.getLatest().binanceIntegrationLock
        ) {
            binanceLocker.save({
                binanceIntegrationLock: Date.now(),
            });
            binanceApiClient.getUserInfoAsync(
                bufferBinanceKeyIntegrationToken,
                bufferBinanceSecretIntegrationToken
            ).then(
                userInfo => {
                    this.saveBinanceSettings({
                        binanceIntegrationEnabled: this.state.binanceIntegrationEnabled,
                        binanceKeyIntegrationToken: bufferBinanceKeyIntegrationToken,
                        binanceSecretIntegrationToken: bufferBinanceSecretIntegrationToken,
                        binanceUserInfo: userInfo,
                    });
                })
                .catch(e => {
                    console.warn(e);
                    this.setState({
                        saveSettingsRequested: false,
                    });
                    binanceLocker.save({});
                })
        }
        return [
            <button title="Settings" key="settings-button" className="settings-button"
                    onClick={event => this.switchState()}>
                <span role="img" aria-label="settings">⚙️</span>
            </button>,
            !this.state.settingsWindowRequested ? null : <div key="settings-container" className="settings-container">
                <div className="settings--shadow" onClick={event => this.switchState()}/>
                <div className="settings--box">
                    <div className="settings--list">
                        <div id="integration-monobank" className="integration-container">
                            <label className="document--label"><input
                                type="checkbox"
                                checked={!!this.state.monobankIntegrationEnabled}
                                onChange={event => {
                                    this.setState({
                                        monobankIntegrationEnabled: !this.state.monobankIntegrationEnabled,
                                    })
                                }}
                            />&nbsp;<span>Enable monobank integration</span></label>
                            {
                                !(this.state.monobankIntegrationEnabled) ? null : <div>
                                    <div className="integration-container--monobank-token-input-wrapper">
                                        <div>
                                            <input type="text"
                                                   placeholder="monobank API token"
                                                   onChange={event => this.setState({
                                                       bufferMonobankIntegrationToken: event.target.value,
                                                   })}
                                                   value={(bufferMonobankIntegrationToken === undefined)
                                                       ? (this.state.monobankIntegrationToken || "")
                                                       : bufferMonobankIntegrationToken}
                                                   className="integration-container--monobank-token-input"/>
                                            {
                                                !this.state.saveSettingsRequested ? null : (
                                                    <span>Checking...</span>
                                                    //    todo: add loading animation
                                                )
                                            }
                                        </div>
                                        <p className="integration-container--monobank-info">
                                            <a target="new-window" href="https://api.monobank.ua/">Get monobank API
                                                token here</a>
                                        </p>
                                    </div>
                                </div>
                            }
                        </div>
                        <div id="integration-binance" className="integration-container">
                            <label className="document--label"><input
                                type="checkbox"
                                checked={!!this.state.binanceIntegrationEnabled}
                                onChange={event => {
                                    this.setState({
                                        binanceIntegrationEnabled: !this.state.binanceIntegrationEnabled,
                                    })
                                }}
                            />&nbsp;<span>Enable binance integration</span></label>
                            {
                                !(this.state.binanceIntegrationEnabled) ? null : <div>
                                    <div className="integration-container--binance-token-input-wrapper">
                                        <div>
                                            <input type="text"
                                                   placeholder="binance API key"
                                                   onChange={event => this.setState({
                                                       bufferBinanceKeyIntegrationToken: event.target.value,
                                                   })}
                                                   value={(bufferBinanceKeyIntegrationToken === undefined)
                                                       ? (this.state.binanceKeyIntegrationToken || "")
                                                       : bufferBinanceKeyIntegrationToken}
                                                   className="integration-container--binance-token-input"/>
                                        </div>
                                        <div>
                                            <input type="text"
                                                   placeholder="binance API secret"
                                                   onChange={event => this.setState({
                                                       bufferBinanceSecretIntegrationToken: event.target.value,
                                                   })}
                                                   value={(bufferBinanceSecretIntegrationToken === undefined)
                                                       ? (this.state.binanceSecretIntegrationToken || "")
                                                       : bufferBinanceSecretIntegrationToken}
                                                   className="integration-container--binance-token-input"/>
                                        </div>
                                        {
                                            !this.state.saveSettingsRequested ? null : (
                                                <span>Checking...</span>
                                                //    todo: add loading animation
                                            )
                                        }
                                        <p className="integration-container--binance-info">
                                            <a
                                                target="new-window"
                                                href="https://www.binance.com/en/support/faq/360002502072/">
                                                Get binance API token here
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            }
                        </div>
                        <div id="export-data" className="integration-container">
                            <label className="document--label"><input
                                type="checkbox"
                                checked={!!this.state.exportDataEnabled}
                                onChange={event => {
                                    this.setState({
                                        exportDataEnabled: !this.state.exportDataEnabled,
                                    })
                                }}
                            />&nbsp;<span>Export data</span></label>
                            {
                                !(this.state.exportDataEnabled) ? null : <div>
                                    <div className="integration-container--export-data-input-wrapper">
                                        <div>
                                            <input type="text"
                                                   readOnly={true}
                                                   value={this.generateExportData()}
                                                   className="integration-container--export-data-input"/>
                                        </div>
                                    </div>
                                </div>
                            }
                        </div>
                        <div id="import-data" className="integration-container">
                            <label className="document--label"><input
                                type="checkbox"
                                checked={!!this.state.importDataEnabled}
                                onChange={event => {
                                    this.setState({
                                        importDataEnabled: !this.state.importDataEnabled,
                                    })
                                }}
                            />&nbsp;<span>Import data</span></label>
                            {
                                !(this.state.importDataEnabled) ? null : <div>
                                    <div className="integration-container--import-data-input-wrapper">
                                        <div>
                                            <input type="text"
                                                   placeholder="import data"
                                                   onChange={event => this.setState({
                                                       bufferImportData: event.target.value,
                                                   })}
                                                   className="integration-container--import-data-input"/>
                                            {
                                                !this.state.saveSettingsRequested ? null : (
                                                    <span>Checking...</span>
                                                    //    todo: add loading animation
                                                )
                                            }
                                        </div>
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                    <div className="settings--controls">
                        <button
                            onClick={event => {
                                const state = {saveSettingsRequested: true};

                                if (this.state.monobankIntegrationEnabled
                                    && !this.state.bufferMonobankIntegrationToken) {
                                    state.bufferMonobankIntegrationToken = this.state.monobankIntegrationToken;
                                }
                                if (this.state.binanceIntegrationEnabled
                                    && !this.state.bufferBinanceKeyIntegrationToken) {
                                    state.bufferBinanceKeyIntegrationToken = this.state.binanceKeyIntegrationToken;
                                }
                                if (this.state.importDataEnabled && this.state.bufferImportData) {
                                    state.bufferImportData = this.state.bufferImportData;
                                }
                                this.setState(state);
                            }}
                            title={"save"}
                            className="settings--control settings--controls-save">Save
                        </button>
                    </div>
                </div>
            </div>
        ]
    }

    generateExportData() {
        let data = {};
        settingsRepository.exist() && (data[settingsRepository.name] = settingsRepository.getLatest());
        monobankUserDataRepository.exist() && (data[monobankUserDataRepository.name] = monobankUserDataRepository.getLatest());
        binanceUserDataRepository.exist() && (data[binanceUserDataRepository.name] = binanceUserDataRepository.getLatest());
        assetsRepository.exist() && (data[assetsRepository.name] = assetsRepository.getLatest());
        return new Buffer(encodeURIComponent(JSON.stringify(data))).toString('base64');
    }

    readImportedData(data) {
        try {
            let text = new Buffer(data, 'base64').toString('ascii');
            try {
                let parsed = JSON.parse(decodeURIComponent(text));
                this.storeData(parsed);
                console.log("imported successfully")
            } catch (e) {
                console.error("error while parsing json string: ", text)
                console.error(e)
            }
        } catch (e) {
            console.error("error while decoding string: ", data)
            console.error(e)
        }
    }

    storeData(data) {
        data[settingsRepository.name] && settingsRepository.save(data[settingsRepository.name]);
        data[monobankUserDataRepository.name] && monobankUserDataRepository.save(data[monobankUserDataRepository.name]);
        data[binanceUserDataRepository.name] && binanceUserDataRepository.save(data[binanceUserDataRepository.name]);
        data[assetsRepository.name] && assetsRepository.save(data[assetsRepository.name]);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.state.saveSettingsRequested
            && !this.state.monobankIntegrationEnabled
        ) {
            monobankLocker.save({
                monobankIntegrationLock: Date.now(),
            });
            this.saveMonobankSettings({
                monobankIntegrationEnabled: this.state.monobankIntegrationEnabled,
            })
        }
        if (this.state.saveSettingsRequested
            && !this.state.binanceIntegrationEnabled
        ) {
            binanceLocker.save({
                binanceIntegrationLock: Date.now(),
            });
            this.saveBinanceSettings({
                binanceIntegrationEnabled: this.state.binanceIntegrationEnabled,
            })
        }

        const bufferImportData = this.state.bufferImportData;

        if (this.state.saveSettingsRequested
            && this.state.importDataEnabled
            && bufferImportData
        ) {
            this.readImportedData(bufferImportData);
            this.setState({
                importDataEnabled: false,
                bufferImportData: undefined,
            })
        }
    }
}
