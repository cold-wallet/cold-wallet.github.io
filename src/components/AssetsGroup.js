import React from "react";
import {AssetsGroupTitle} from "./AssetsGroupTitle";
import {Asset} from "./Asset";
import './AssetsGroup.css';
import {AddAssetButton} from "./AddAssetButton";

export class AssetsGroup extends React.Component {
    render() {
        return (
            <div className={"assets-group"}>
                <AssetsGroupTitle value={this.props.type}/>
                <Asset value={0} currency={"USD"}/>
                <AddAssetButton/>
            </div>
        );
    }
}
