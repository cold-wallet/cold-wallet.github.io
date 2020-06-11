import React from "react";
import {NewAssetMenu} from "./NewAssetMenu";
import {AssetsGroup} from "./AssetsGroup";
import AssetDTO from "./AssetDTO";
import './AssetsGroupsWrapper.css';
import assetsRepository from "./assetsRepository";

export class AssetsGroupsWrapper extends React.Component {

    static defaultProps = {
        savedState: {},
    };

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
        const storedData = assetsRepository.getLatest();
        this.setState({savedState: storedData.assets})
    }

    render() {
        if (!this.state.savedState) {
            return null
        }
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
            [
                this.props.savedState.cash,
                this.props.savedState["non-cash"],
                this.props.savedState.crypto,
            ].map((group) =>
                <AssetsGroup key={group.type}
                             spawnMenu={({onSettingsSet}) => this.setState({
                                 showMenu: group.type,
                                 onSettingsSet: onSettingsSet,
                             })}
                             saveStateFunction={(assets) => {
                                 const buffer = this.props.savedState;
                                 buffer[group.type].assets = assets.map(AssetDTO.copy);
                                 assetsRepository.save({
                                     assets: buffer,
                                 });
                             }}
                             group={group}
                />
            ),
        ]}</div>
    }
}
