import * as React from "react";
import './Settings.css'
import settingsRepository from "../settings/SettingsRepository";
import monobankApiClient from "../integration/monobank/monobankApiClient";
import monobankUserDataRepository from "../integration/monobank/MonobankUserDataRepository";
import binanceUserDataRepository from "../integration/binance/BinanceUserDataRepository";
import LocalStorageRepository from "../extensions/LocalStorageRepository";

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

    componentDidMount() {
        if (!this.state.saveSettingsRequested
            && this.state.monobankIntegrationEnabled
            && this.state.monobankIntegrationToken
        ) {
            try {
                monobankApiClient.getUserInfo(
                    this.state.monobankIntegrationToken,
                    userInfo => {
                        monobankUserDataRepository.save({
                            clientId: userInfo.clientId,
                            name: userInfo.name,
                            accounts: userInfo.accounts,
                        });
                    },
                    console.error
                );
            } catch (e) {
                console.error(e)
            }
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
            clientId: settings.clientId,
            name: settings.name,
            accounts: settings.accounts,
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
            try {
                this.saveBinanceSettings({
                    binanceIntegrationEnabled: this.state.binanceIntegrationEnabled,
                    binanceKeyIntegrationToken: bufferBinanceKeyIntegrationToken,
                    binanceSecretIntegrationToken: bufferBinanceSecretIntegrationToken,
                });
            } catch (e) {
                binanceLocker.save({})
            }
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
                                checked={this.state.monobankIntegrationEnabled}
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
                                checked={this.state.binanceIntegrationEnabled}
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
                                                href="https://www.binance.com/en/usercenter/settings/api-management/">
                                                Get binance API token here
                                            </a>
                                        </p>
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
}
