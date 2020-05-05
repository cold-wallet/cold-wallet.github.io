import React from "react";
import {AssetsGroup} from "./AssetsGroup";
import './AssetsWrapper.css';
import {AssetsWrapperTitle} from "./AssetsWrapperTitle";

export class AssetsWrapper extends React.Component {
    render() {
        return (
            <div className={"assets-wrapper"}>
                <AssetsWrapperTitle value={"So you have:"}/>
                <div className={"assets-groups-wrapper"}>
                    <AssetsGroup type={"cash"}/>
                    <AssetsGroup type={"non-cash"}/>
                    <AssetsGroup type={"crypto"}/>
                </div>
            </div>
        );
    }
}
