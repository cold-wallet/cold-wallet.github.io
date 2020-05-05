import React from 'react';
import {CookiesProvider, useCookies} from 'react-cookie';
import './App.css';
import {ResultsWrapper} from "./components/ResultsWrapper";
import {AssetsWrapper} from "./components/AssetsWrapper";

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

function App() {
    const cookieName = 'assets';
    const [cookies, setCookie] = useCookies([cookieName]);
    const savedState = (Object.keys(cookies).length === 0 && cookies.constructor === Object)
        ? buildDefaultState()
        : cookies;
    return (
        <CookiesProvider>
            <div className="dashboard">
                <AssetsWrapper savedState={savedState}/>
                <ResultsWrapper/>
            </div>
        </CookiesProvider>
    );
}

export default App;
