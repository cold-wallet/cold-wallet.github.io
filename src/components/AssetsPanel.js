import React from "react";
import './AssetsPanel.css';
import {useCookies} from "react-cookie";
import {AssetsGroupsWrapper} from "./AssetsGroupsWrapper";


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
    // noinspection JSUnusedLocalSymbols
    const [cookies, setCookie] = useCookies([cookieName]);
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
