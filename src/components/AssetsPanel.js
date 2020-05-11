import React from "react";
import './AssetsPanel.css';
import Cookies from 'universal-cookie';
import {AssetsGroupsWrapper} from "./AssetsGroupsWrapper";

const cookieName = 'assets';

export function AssetsPanel() {
    let cookies = new Cookies();
    let savedState = readCookies(cookies.get(cookieName));

    return <div className={"assets-wrapper"}>
        <div className={"assets-wrapper-title"}>{"So if you have:"}</div>
        <AssetsGroupsWrapper
            savedState={savedState}
            saveState={(state) => {
                console.log("saving cookies:", state);
                cookies.set(cookieName, state);
            }}
        />
    </div>
}

function readCookies(savedCookies) {
    if (savedCookies) {
        console.log("read cookies:", savedCookies);
        return savedCookies
    } else {
        return buildEmptyState()
    }
}

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
