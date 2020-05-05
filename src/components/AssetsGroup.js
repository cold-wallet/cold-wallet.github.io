import React from "react";
import {AssetsTitle} from "./AssetsTitle";
import {Asset} from "./Asset";

export class AssetsGroup extends React.Component {
    render() {
        return (
            <div>
                <AssetsTitle value={this.props.type}/>
                <Asset value={0} currency={"USD"}/>
                <button>+</button>
            </div>
        );
    }
}