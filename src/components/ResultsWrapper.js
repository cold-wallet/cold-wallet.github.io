import React from "react";
import './ResultsWrapper.css'

export default class ResultsWrapper extends React.Component {
    static defaultProps = {
        savedState: {},
    };

    render() {
        return <div className={"results-wrapper"}>
            <div className={"results-title"}>Then short statistics would be:</div>
            <div className={"results-container"}>{
                getAnalyzers().map((analyzer, i) =>
                    analyzer.buildInnerResult(i, this.props.savedState)
                )
            }</div>
        </div>;
    }
}

function getAnalyzers() {
    return [{
        buildInnerResult(key, data) {
            console.log("Building inner result for state", data);
            return null;
        }
    }]
}
