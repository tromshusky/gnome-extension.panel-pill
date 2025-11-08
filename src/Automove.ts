import * as Main from "resource:///org/gnome/shell/ui/main.js";
import PanelPillExtension from "./extension.js";
import { newTopWidget, WidgetType } from './topWidget.js';

export default class Automove {

    #extension: PanelPillExtension;
    #ghostPanel: WidgetType | undefined;

    constructor(ppe: PanelPillExtension) {
        this.#extension = ppe;
    }

    enable() {
        this.#ghostPanel = newTopWidget(Main.layoutManager.panelBox);
        this.#ghostPanel.x -= 10;
        this.#ghostPanel.y = 5;
        this.#ghostPanel.width += 20;
        this.#ghostPanel.height = Main.panel.height + 5;
        this.enableAutomove();
    }

    disable() {
        this.disableAutomove();
        this.#ghostPanel?.destroy();
        this.#ghostPanel = undefined;
    }

    enableAutomove() {

    }

    disableAutomove() {

    }

}