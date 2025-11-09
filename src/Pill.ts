import PanelPillExtension from "./extension.js";
import PanelUI from "./PanelUI.js";


export default class Pill {
    #extension: PanelPillExtension;


    constructor(ppe: PanelPillExtension) {
        this.#extension = ppe;
    }

    enable(): PanelPillExtension {
        PanelUI.shrinkToPill();
        PanelUI.setLowTransparency();
        PanelUI.setRoundStyle();
        return this.#extension;
    }

    disable(): PanelPillExtension {
        PanelUI.expandToNormal();
        PanelUI.setNoTransparency();
        PanelUI.setNoStyle();
        return this.#extension;
    }

}

