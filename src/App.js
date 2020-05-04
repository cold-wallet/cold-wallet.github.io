import React from 'react';
import './App.css';
import {ResultsWrapper} from "./components/ResultsWrapper";
import {AssetsWrapper} from "./components/AssetsWrapper";

function App() {
    return (
        <div className="dashboard">
            <AssetsWrapper/>
            <ResultsWrapper/>
            <button className="add-new-item">+</button>
        </div>
    );
}

export default App;
