import React from "react";
import './NewAssetMenu.css'
import btcIcon from '../resources/currencies/btc.png'
import usdtIcon from '../resources/currencies/usdt.png'
import ethIcon from '../resources/currencies/eth.png'
import ltcIcon from '../resources/currencies/ltc.png'
import eosIcon from '../resources/currencies/eos.png'
import bchIcon from '../resources/currencies/bch.png'
import rates from "../integration/ratesClient";

export default class NewAssetMenu extends React.Component {
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
                    </div>
                    <div className={"new-asset-menu--body"}>{
                        this.state.bufferCurrency
                            ? this.finish()
                            : <div key={"currency-select"}>
                                <div className={"asset-pics--container"}>{
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
                                }</div>
                                <div className={"find-asset--container"}>
                                    <select className="find-asset--select"
                                            onChange={e => this.onCurrencySelected({
                                                currencyCode: e.target.value,
                                            })}>
                                        <option disabled selected value> -- select currency --</option>
                                        {
                                            rates.getCurrenciesByType(this.props.assetType).map(currency => {
                                                return (
                                                    <option key={currency.code}
                                                            title={currency.name}
                                                            value={currency.code}>{
                                                        currency.code + (currency.crypto
                                                                ? ""
                                                                : `\t - ${currency.name}`
                                                        )
                                                    }</option>
                                                )
                                            })
                                        }</select>
                                </div>
                            </div>
                    }</div>
                </div>
            </div>
        )
    }

    finish() {
        this.setState({
            bufferCurrency: null,
        });
        this.props.onSettingsSet({
            currencyCode: this.state.bufferCurrency,
            name: this.state.bufferCurrency + " amount",
        });
        this.props.hideMenu();
    }
}

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
        case "fiat":
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
