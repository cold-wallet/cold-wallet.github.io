import React from "react";
import NewAssetMenu from "./NewAssetMenu";
import AssetsGroup from "./AssetsGroup";
import AssetDTO from "./AssetDTO";
import './AssetsGroupsWrapper.css';
import assetsService from "../assets/AssetService";

export default class AssetsGroupsWrapper extends React.Component {

    state = {
        showMenu: false,
        onSettingsSet: () => false,
    };

    hideMenu() {
        this.setState({
            showMenu: false,
            onSettingsSet: () => false,
        })
    }

    componentDidMount() {
        const assets = assetsService.getCurrentAssets();
        this.setState({savedState: assets.assets});
        assetsService.subscribeOnChange(assets => {
            this.setState({savedState: assets.assets});
        });
    }

    render() {
        if (!this.state.savedState) {
            return null
        }
        const assets = [
            this.state.savedState.fiat || mergeFiatGroup(this.state.savedState.cash, this.state.savedState["non-cash"]),
            this.state.savedState.crypto,
        ];
        return <div className="assets-groups-wrapper" translate="no">{[
            this.state.showMenu
                ? <NewAssetMenu
                    key={0}
                    hideMenu={() => this.hideMenu()}
                    onSettingsSet={(settings) => {
                        this.state.onSettingsSet(settings);
                    }}
                    assetType={this.state.showMenu}
                />
                : null,
            assets.map((group) =>
                <AssetsGroup key={group.type}
                             spawnMenu={({onSettingsSet}) => this.setState({
                                 showMenu: group.type,
                                 onSettingsSet: onSettingsSet,
                             })}
                             saveStateFunction={(assets) => {
                                 const buffer = this.state.savedState;
                                 buffer[group.type] || (buffer[group.type] = {});
                                 buffer[group.type].type = group.type;
                                 buffer[group.type].assets = assets.map(AssetDTO.copy);
                                 delete buffer.cash;
                                 delete buffer["non-cash"];
                                 assetsService.save({
                                     assets: buffer,
                                 });
                             }}
                             group={group}
                />
            ),
        ]}</div>
    }
}

function mergeFiatGroup(mergeMe0, mergeMe1) {
    const type = "fiat";
    return {
        type: type,
        assets: [].concat(mergeMe0.assets).concat(mergeMe1.assets).map(asset => {
            asset.type = type;
            return asset
        })
    }
}
