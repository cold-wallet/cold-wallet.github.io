import * as React from "react";
import './Settings.css'
import settingsRepository from "../repo/SettingsRepository";
import monobankApiClient from "../extensions/monobankApiClient";
import monobankUserDataRepository from "../repo/MonobankUserDataRepository";
import lockerRepository from "../extensions/locker";

export default class Settings extends React.Component {

    settingsSaved = false;

    constructor(props, context) {
        super(props, context);
        const currentSettings = settingsRepository.getLatest();
        this.state = {
            settingsWindowRequested: false,
            monobankIntegrationEnabled: currentSettings.integrations.monobank.monobankIntegrationEnabled,
            monobankIntegrationToken: currentSettings.integrations.monobank.monobankIntegrationToken,
        };
    }

    switchState() {
        this.setState({
            settingsWindowRequested: !this.state.settingsWindowRequested,
        })
    }

    saveSettings(settings) {
        settingsRepository.save({
            integrations: {
                monobank: {
                    monobankIntegrationEnabled: settings.monobankIntegrationEnabled,
                    monobankIntegrationToken: settings.monobankIntegrationToken,
                },
            }
        });

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
        }, () => lockerRepository.save({}));
    }

    render() {
        const bufferMonobankIntegrationToken = this.state.bufferMonobankIntegrationToken;

        if (this.state.saveSettingsRequested
            && !this.settingsSaved
            && this.state.monobankIntegrationEnabled
            && bufferMonobankIntegrationToken
            && !lockerRepository.getLatest().monobankIntegrationLock
        ) {
            lockerRepository.save({
                monobankIntegrationLock: Date.now(),
            });
            monobankApiClient.getUserInfo(
                bufferMonobankIntegrationToken,
                userInfo => {
                    this.saveSettings({
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
                        isInvalidBufferMonobankIntegrationToken: true,
                    });
                    lockerRepository.save({});
                });
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
                    </div>
                    <div className="settings--controls">
                        <button
                            onClick={event => {
                                console.log("state", this.state);
                                const state = (this.state.monobankIntegrationEnabled
                                    && !this.state.bufferMonobankIntegrationToken)
                                    ? {
                                        bufferMonobankIntegrationToken: this.state.monobankIntegrationToken,
                                        saveSettingsRequested: true
                                    }
                                    : {saveSettingsRequested: true};
                                this.setState(state);
                            }}
                            className="settings--control settings--controls-save">Save
                        </button>
                    </div>
                </div>
            </div>
        ]
    }
}
