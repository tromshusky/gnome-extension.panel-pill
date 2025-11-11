import PanelPillExtension from "./extension.js";
import PanelUI from "./PanelUI.js";


export default class Pill {
    #extension: PanelPillExtension;


    constructor(ppe: PanelPillExtension) {
        this.#extension = ppe;
    }

    enable(): PanelPillExtension {
        PanelUI.shrinkToPill();
        PanelUI.setPillTransparency();
        PanelUI.setRoundStyle();
        return this.#extension;
    }

    disable(): PanelPillExtension {
        PanelUI.expandToNormal();
        PanelUI.setFactoryTransparency();
        PanelUI.setNoStyle();
        return this.#extension;
    }

}

