import React from 'react';
import './App.css';
import ResultsWrapper from "./components/ResultsWrapper";
import {useCookies} from "react-cookie";
import {AssetsGroupsWrapper} from "./components/AssetsGroupsWrapper";
import "./fonts.scss";
import "./mixin.scss";
import "./reset.scss";

const cookieName = 'assets';

export default function App() {
    const [cookies, setCookie] = useCookies();
    const savedState = readCookies(cookies)[cookieName];

    return <div className="dashboard">
        <div className={"assets-wrapper"}>
            <div className={"assets-wrapper-title"}>{"So if you have:"}</div>
            <AssetsGroupsWrapper
                savedState={savedState}
                saveState={(state) => {
                    console.log("saving cookies:", state);
                    setCookie(cookieName, state);
                }}
            />
        </div>
        <ResultsWrapper savedState={savedState}/>
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
