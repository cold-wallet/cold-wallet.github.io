import React from 'react';
import {CookiesProvider} from 'react-cookie';
import './App.css';
import {ResultsWrapper} from "./components/ResultsWrapper";
import {AssetsPanel} from "./components/AssetsPanel";

function App() {
    return (
        <div className="dashboard">
            <CookiesProvider>
                <AssetsPanel/>
            </CookiesProvider>
            <ResultsWrapper/>
        </div>
    );
}

export default App;
