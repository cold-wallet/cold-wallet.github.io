import React from "react";
import {AssetsGroup} from "./AssetsGroup";
import './AssetsPanel.css';
import {useCookies} from "react-cookie";


function buildDefaultState() {
    return {
        cash: {
            type: 'cash',
            assets: [{
                type: 'cash',
                amount: 0,
                currency: "USD"
            }]
        },
        nonCash: {
            type: 'non-cash',
            assets: [{
                type: 'non-cash',
                amount: 0,
                currency: "USD"
            }]
        },
        crypto: {
            type: 'crypto',
            assets: [{
                type: 'crypto',
                amount: 0,
                currency: "BTC"
            }]
        },
    }
}

export function AssetsPanel() {
    const cookieName = 'assets';
    const [cookies, setCookie] = useCookies([cookieName]);
    const savedState = (Object.keys(cookies).length === 0 && cookies.constructor === Object)
        ? buildDefaultState()
        : cookies;

    return (
        <div className={"assets-wrapper"}>
            <div className={"assets-wrapper-title"}>{"So you have:"}</div>
            <div className={"assets-groups-wrapper"}>
                <AssetsGroup group={savedState.cash}/>
                <AssetsGroup group={savedState.nonCash}/>
                <AssetsGroup group={savedState.crypto}/>
            </div>
        </div>
    );
}
