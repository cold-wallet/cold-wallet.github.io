import React from 'react';
import './App.css';
import ResultsWrapper from "./components/ResultsWrapper";
import {AssetsGroupsWrapper} from "./components/AssetsGroupsWrapper";
import "./fonts.scss";
import "./mixin.scss";
import "./reset.scss";
import assetsRepository from "./repo/assetsRepository";


export default function App() {
    const storedData = assetsRepository.getLatest();
    const savedState = storedData.assets;

    return <div className="dashboard">
        <div className={"assets-wrapper"}>
            <div translate="no" className={"assets-wrapper-title"}>{"So if you have:"}</div>
            <AssetsGroupsWrapper savedState={savedState}/>
        </div>
        <ResultsWrapper savedState={savedState}/>
    </div>
}
