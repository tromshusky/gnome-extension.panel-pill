import PanelPillExtension from "./extension.js";
import PanelUI from "./panelUI.js";


export default class Pill {
    #extension: PanelPillExtension;


    constructor(ppe: PanelPillExtension) {
        this.#extension = ppe;
    }

    enable(): PanelPillExtension {
        PanelUI.shrinkToPill();
        return this.#extension;
    }

    disable(): PanelPillExtension {
        PanelUI.expandToNormal();
        return this.#extension;
    }

}

