import React from "react";
import './NewAssetMenu.css'

export function NewAssetMenu({hideMenu}) {
    return (
        <div className={"new-asset-menu-wrapper"}>
            <div className={"new-asset-menu-shadow"} onClick={hideMenu}/>
            <div className={"new-asset-menu"}>
                <div className={"close-new-asset-menu-button-wrapper"}>
                    <button className={"close-new-asset-menu-button"} onClick={hideMenu}>x</button>
                </div>
            </div>
        </div>
    )
}
