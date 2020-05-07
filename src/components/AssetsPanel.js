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
    const [cookies, setCookie] = useCookies([cookieName]);
    let savedState;

    if (Object.keys(cookies).length === 0 || !cookies[cookieName]) {
        savedState = buildEmptyState()
    } else {
        console.log("read cookies:", cookies);
        savedState = cookies[cookieName]
    }

    return <div className={"assets-wrapper"}>
        <div className={"assets-wrapper-title"}>{"So if you have:"}</div>
        <AssetsGroupsWrapper
            savedState={savedState}
            saveState={(state) => {
                console.log("saving cookies:", state);
                setCookie(cookieName, state)
            }}
        />
    </div>
}
