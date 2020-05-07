import React from "react";
import {NewAssetMenu} from "./NewAssetMenu";
import {AssetsGroup} from "./AssetsGroup";

export class AssetsGroupsWrapper extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            showMenu: false,
            onCurrencySelected: () => false
        };
    }

    spawnMenu({type, onCurrencySelected}) {
        this.setState({
            showMenu: type,
            onCurrencySelected: onCurrencySelected
        })
    }

    hideMenu() {
        this.setState({
            showMenu: false,
            onCurrencySelected: () => false
        })
    }

    render() {
        return (<div className={"assets-groups-wrapper"}>
            {
                this.state.showMenu
                    ? <NewAssetMenu
                        hideMenu={() => this.hideMenu()}
                        onCurrencySelected={(currency) => this.state.onCurrencySelected(currency)}
                        assetType={this.state.showMenu}
                    />
                    : null
            }
            {
                [
                    this.props.savedState.cash,
                    this.props.savedState["non-cash"],
                    this.props.savedState.crypto,
                ].map((group) =>
                    <AssetsGroup key={group.type}
                                 spawnMenu={({onCurrencySelected}) => this.spawnMenu({
                                     type: group.type,
                                     onCurrencySelected: onCurrencySelected
                                 })}
                                 group={group}
                    />
                )
            }
        </div>);
    }
}
