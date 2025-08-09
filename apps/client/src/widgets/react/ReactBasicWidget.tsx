import { createContext, JSX, render } from "preact";
import BasicWidget from "../basic_widget.js";
import Component from "../../components/component.js";

export const ParentComponent = createContext<Component | null>(null);

export default abstract class ReactBasicWidget extends BasicWidget {

    abstract get component(): JSX.Element;

    doRender() {
        const renderContainer = new DocumentFragment();
        render((
            <ParentComponent.Provider value={this}>
                {this.component}
            </ParentComponent.Provider>
        ), renderContainer);
        this.$widget = $(renderContainer.firstChild as HTMLElement);
    }

}
