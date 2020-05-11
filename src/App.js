import React from 'react';
import './App.css';
import {ResultsWrapper} from "./components/ResultsWrapper";
import {AssetsPanel} from "./components/AssetsPanel";

import "./fonts.scss";
import "./mixin.scss";
import "./reset.scss";

function App() {
    return (
        <div className="dashboard">
            <AssetsPanel/>
            <ResultsWrapper/>
        </div>
    );
}

export default App;
