import React from "react";
import {NewAssetMenu} from "./NewAssetMenu";
import {AssetsGroup} from "./AssetsGroup";
import AssetDTO from "./AssetDTO";

export class AssetsGroupsWrapper extends React.Component {

    state = {
        showMenu: false,
        onCurrencySelected: () => false
    };

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
        return <div className={"assets-groups-wrapper"}>{[
            this.state.showMenu
                ? <NewAssetMenu
                    key={0}
                    hideMenu={() => this.hideMenu()}
                    onCurrencySelected={(currency) => {
                        this.state.onCurrencySelected(currency);
                    }}
                    assetType={this.state.showMenu}
                />
                : null,
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
                             saveStateFunction={(assets) => {
                                 const buffer = this.props.savedState;
                                 buffer[group.type].assets = assets.map(asset => new AssetDTO(
                                     asset.type, asset.amount, asset.currency,
                                 ));
                                 this.props.saveState(buffer);
                             }}
                             group={group}
                />
            ),
        ]}</div>
    }
}
