import React from "react";
import './AddAssetButton.css'

export class AddAssetButton extends React.Component {
    render() {
        return (
            <div className={"add-asset-button-wrapper"}>
                <button className={"add-asset-button"}>+</button>
            </div>
        );
    }
}
