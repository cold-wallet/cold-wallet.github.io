import React from "react";
import './AssetsPanel.css';
import {useCookies} from "react-cookie";
import {AssetsGroupsWrapper} from "./AssetsGroupsWrapper";
import AssetDTO from "./AssetDTO";


function buildDefaultState() {
    return {
        cash: {
            type: 'cash',
            assets: [new AssetDTO('cash', 0, "USD")],
        },
        nonCash: {
            type: 'non-cash',
            assets: [new AssetDTO('non-cash', 0, "USD")],
        },
        crypto: {
            type: 'crypto',
            assets: [new AssetDTO('crypto', 0, "BTC")],
        },
    }
}

export function AssetsPanel() {
    const cookieName = 'assets';
    const [cookies] = useCookies([cookieName]);
    const savedState = (Object.keys(cookies).length === 0 && cookies.constructor === Object)
            ? buildDefaultState()
            : cookies;

    return (
        <div className={"assets-wrapper"}>
            <div className={"assets-wrapper-title"}>{"So if you have:"}</div>
            <AssetsGroupsWrapper savedState={savedState}/>
        </div>
    );
}
