import React from "react";
import './NewAssetMenu.css'
import btcIcon from '../resources/currencies/btc.png'
import usdtIcon from '../resources/currencies/usdt.png'
import ethIcon from '../resources/currencies/eth.png'
import ltcIcon from '../resources/currencies/ltc.png'
import eosIcon from '../resources/currencies/eos.png'
import bchIcon from '../resources/currencies/bch.png'

function getListOfTopCurrenciesByType(type) {
    switch (type) {
        case "crypto":
            return [
                {
                    name: "Bitcoin",
                    code: "BTC",
                    icon: btcIcon,
                },
                {
                    name: "Ethereum",
                    code: "ETH",
                    icon: ethIcon,
                },
                {
                    name: "Tether",
                    code: "USDT",
                    icon: usdtIcon,
                },
                {
                    name: "Litecoin",
                    code: "LTC",
                    icon: ltcIcon,
                },
                {
                    name: "EOS",
                    code: "EOS",
                    icon: eosIcon,
                },
                {
                    name: "Bitcoin Cash",
                    code: "BCH",
                    icon: bchIcon,
                },
            ].map(info => {
                info.htmlCode = <img className={"asset-pic--image-img"} src={info.icon} alt={info.name}/>;
                return info;
            });
        case "cash":
        case "non-cash":
        default:
            return [
                {
                    name: "US Dollar",
                    code: "USD",
                    htmlCode: <span className={"asset-currency-icon"}>&#x24;</span>
                },
                {
                    name: "Euro",
                    code: "EUR",
                    htmlCode: <span className={"asset-currency-icon"}>&euro;</span>
                },
                {
                    name: "Pound sterling",
                    code: "GBP",
                    htmlCode: <span className={"asset-currency-icon"}>&#xA3;</span>
                },
                {
                    name: "Ukrainian hryvnia",
                    code: "UAH",
                    htmlCode: <span className={"asset-currency-icon"}>&#8372;</span>
                },
                {
                    name: "Polish zloty",
                    code: "PLN",
                    htmlCode: <span className={"asset-currency-icon"}>&#122;&#322;</span>
                },
                {
                    name: "Russian ruble",
                    code: "RUB",
                    htmlCode: <span className={"asset-currency-icon"}>&#x20BD;</span>
                },
            ];
    }
}

export class NewAssetMenu extends React.Component {
    static defaultProps = {
        hideMenu: () => false,
        assetType: '',
        onSettingsSet: () => false,
    };

    state = {};

    onCurrencySelected({currencyCode}) {
        this.setState({
            bufferCurrency: currencyCode,

        })
    }

    render() {
        return (
            <div className={"new-asset-menu-wrapper"}>
                <div className={"new-asset-menu-shadow"} onClick={this.props.hideMenu}/>
                <div className={"new-asset-menu"}>
                    <div className={"new-asset-menu--header"}>
                        <div className={"new-asset-menu--header-title"}>Choose currency of new asset</div>
                        {/*<button className={"new-asset-menu--close-button negative-button"} onClick={hideMenu}>✖</button>*/}
                    </div>
                    <div className={"new-asset-menu--body"}>{
                        this.state.bufferCurrency
                            ? this.buildDataMenu()
                            : <div key={"currency-select"}>
                                <div className={"asset-pics--container"}>
                                    {
                                        getListOfTopCurrenciesByType(this.props.assetType).map((currency, i) =>
                                            <div key={i}
                                                 title={currency.name}
                                                 onClick={() => {
                                                     this.onCurrencySelected({
                                                         currencyCode: currency.code,
                                                     });
                                                 }}
                                                 className={"asset-pic--container"}>
                                                <div className={"asset-pic--image"}>{currency.htmlCode}</div>
                                                <div className={"asset-pic--name"}>{currency.code}</div>
                                            </div>
                                        )
                                    }
                                </div>
                                <div className={"find-asset--container"}>
                                </div>
                            </div>
                    }</div>
                </div>
            </div>
        )
    }

    buildDataMenu() {
        let nameInput, descrInput;
        return (<div className={"new-asset-menu--data"} key={"inputs"}>
            <div><label>
                <div className="new-asset-menu--data-name-input-label">Short name:</div>
                <input
                    ref={instance => {
                        nameInput = instance;
                        if (nameInput) {
                            nameInput.focus && nameInput.focus();
                            nameInput.value = this.state.bufferCurrency + " amount";
                        }
                    }}
                    type="text"
                    className={"new-asset-menu--data-name-input"}/>
            </label></div>
            <div className={"new-asset-menu--data-description-input-label-wrapper"}>
                <label>
                    <div className="new-asset-menu--data-description-input-label">Description:</div>
                    <textarea
                        className={"new-asset-menu--data-description-input"}
                        ref={instance => descrInput = instance}
                    /></label>
            </div>
            <div className="new-asset-menu--data-action-buttons-wrapper">
                <button
                    className="new-asset-menu--data-controls new-asset-menu--data-confirm"
                    onClick={() => {
                        if (!nameInput.value) {
                            return
                        }
                        const currencyCode = this.state.bufferCurrency;
                        this.setState({
                            bufferCurrency: null,
                        });
                        this.props.onSettingsSet({
                            currencyCode: currencyCode,
                            name: nameInput.value,
                            description: descrInput.value || "",
                        });
                        this.props.hideMenu();
                    }}>Confirm
                </button>
                <button
                    className="new-asset-menu--data-controls new-asset-menu--data-cancel"
                    onClick={() => {
                        this.setState({
                            bufferCurrency: null,
                        });
                        this.props.hideMenu();
                    }}
                >Cancel
                </button>
            </div>
        </div>)
    }
}
