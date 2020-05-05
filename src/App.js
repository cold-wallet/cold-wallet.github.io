import React from 'react';
import './App.css';
import {ResultsWrapper} from "./components/ResultsWrapper";
import {AssetsWrapper} from "./components/AssetsWrapper";
import MiddleLine from "./components/MiddleLine";

function App() {
    return (
        <div className="dashboard">
            <AssetsWrapper/>
            <MiddleLine/>
            <ResultsWrapper/>
        </div>
    );
}

export default App;
