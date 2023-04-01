import React from 'react';
import './App.css';
import ResultsWrapper from "./components/ResultsWrapper";
import AssetsGroupsWrapper from "./assets/AssetsGroupsWrapper";
import "./fonts.scss";
import "./mixin.scss";
import "./reset.scss";
import Settings from "./settings/Settings";


export default function App() {
    return <div className="dashboard">
        <ResultsWrapper/>
        <div className={"assets-wrapper"}>
            <div translate="no" className={"assets-wrapper-title"}>{"Your assets:"}</div>
            <AssetsGroupsWrapper/>
        </div>
        <Settings/>
    </div>
}
