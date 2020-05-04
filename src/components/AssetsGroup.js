import React from "react";
import {Title} from "./Title";
import {Asset} from "./Asset";

export class AssetsGroup extends React.Component {
    render() {
        return (
            <div>
                <Title value={this.props.type}/>
                <Asset value={0} currency={"USD"}/>
                <button>+</button>
            </div>
        );
    }
}