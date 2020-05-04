import React from "react";
import {Title} from "./Title";
import {AssetsGroup} from "./AssetsGroup";
import './AssetsWrapper.css';

export class AssetsWrapper extends React.Component {
    render() {
        return (
            <div className={"assets-wrapper"}>
                <Title value={"So you have:"}/>
                <AssetsGroup type={"cash"}/>
                <AssetsGroup type={"non-cash"}/>
                <AssetsGroup type={"crypto"}/>
            </div>
        );
    }
}