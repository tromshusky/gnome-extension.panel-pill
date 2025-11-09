import GLib from "gi://GLib";
import PanelPillExtension, { ROUND_CORNER_DELAY } from "./extension.js";
import PanelUI from "./PanelUI.js";

export default class OverviewAndRoundingFix {

    #extension: PanelPillExtension;
    #timeoutRoundnessID: GLib.Source | undefined;
    #mainOverviewListenerID2: number | undefined;
    #mainOverviewListenerID1: number | undefined;

    constructor(ppe: PanelPillExtension) {
        this.#extension = ppe;
    }

    enableAll() {
        this.enableOverviewOpeningBehaviour();
        this.enableOverviewClosingBehaviour();
    }

    overviewClosingDelayedBehaviour() {
        PanelUI.setRoundStyle();
        PanelUI.makePlaceInOverview();
    }

    overviewClosingBehaviour() {
        if (this.#timeoutRoundnessID != undefined)
            clearTimeout(this.#timeoutRoundnessID);
        this.#timeoutRoundnessID = setTimeout(this.overviewClosingDelayedBehaviour.bind(this), ROUND_CORNER_DELAY);
    }

    enableOverviewClosingBehaviour() {
        if (this.#mainOverviewListenerID2 != undefined)
            PanelUI.overviewDisconnect(this.#mainOverviewListenerID2);
        this.#mainOverviewListenerID2 = PanelUI.overviewConnect('hiding', this.overviewClosingBehaviour.bind(this));
    }

    disableOverviewClosingBehaviour() {
        if (this.#mainOverviewListenerID2 != undefined)
            PanelUI.overviewDisconnect(this.#mainOverviewListenerID2);
        this.#mainOverviewListenerID2 = undefined;
        if (this.#timeoutRoundnessID != undefined)
            clearTimeout(this.#timeoutRoundnessID);
        this.#timeoutRoundnessID = undefined;
    }

    overviewOpeningBehaviour() {
        PanelUI.makePlaceInOverview();
    }

    enableOverviewOpeningBehaviour() {
        if (this.#mainOverviewListenerID1 != undefined)
            PanelUI.overviewDisconnect(this.#mainOverviewListenerID1);
        this.#mainOverviewListenerID1 = PanelUI.overviewConnect('showing', this.overviewOpeningBehaviour.bind(this));
    }

    disableOverviewOpeningBehaviour() {
        if (this.#mainOverviewListenerID1 != undefined)
            PanelUI.overviewDisconnect(this.#mainOverviewListenerID1);
        this.#mainOverviewListenerID1 = undefined;
    }

}