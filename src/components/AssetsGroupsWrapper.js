import React from "react";
import {NewAssetMenu} from "./NewAssetMenu";
import {AssetsGroup} from "./AssetsGroup";

export class AssetsGroupsWrapper extends React.Component {

    constructor(props) {
        super(props);
        this.savedState = props.savedState;
        this.state = {
            showMenu: false,
        };
    }

    spawnMenu(type) {
        this.setState({
            showMenu: type
        })
    }

    hideMenu() {
        this.setState({
            showMenu: false
        })
    }

    render() {
        return (
            <div className={"assets-groups-wrapper"}>
                {
                    this.state.showMenu
                        ? <NewAssetMenu
                            hideMenu={() => this.hideMenu()}
                            assetType={this.state.showMenu}
                        />
                        : null
                }
                {
                    [
                        this.savedState.cash,
                        this.savedState.nonCash,
                        this.savedState.crypto,
                    ].map((group, i) =>
                        <AssetsGroup key={i}
                                     spawnMenu={() => this.spawnMenu(group.type)}
                                     group={group}
                        />
                    )
                }
            </div>
        );
    }
}
