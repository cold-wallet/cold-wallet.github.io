import React from "react";
import './AssetsPanel.css';
import {useCookies} from "react-cookie";
import {AssetsGroupsWrapper} from "./AssetsGroupsWrapper";


function buildEmptyState() {
    return {
        cash: {
            type: 'cash',
            assets: [],
        },
        "non-cash": {
            type: 'non-cash',
            assets: [],
        },
        crypto: {
            type: 'crypto',
            assets: [],
        },
    }
}

export function AssetsPanel() {
    const cookieName = 'assets';
    const [cookies] = useCookies([cookieName]);
    const savedState = (Object.keys(cookies).length === 0 && cookies.constructor === Object)
        ? buildEmptyState()
        : cookies;

    return (
        <div className={"assets-wrapper"}>
            <div className={"assets-wrapper-title"}>{"So if you have:"}</div>
            <AssetsGroupsWrapper savedState={savedState}/>
        </div>
    );
}
