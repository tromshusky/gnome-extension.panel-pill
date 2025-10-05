import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { PANEL_Y, ROUND_CORNER_DELAY } from "./extension.js";
export default class OverviewFix {
    #timeoutRoundnessID = null;
    #mainOverviewListenerID1 = null;
    #mainOverviewListenerID2 = null;
    #panelPill;
    constructor(pill) {
        this.#panelPill = pill;
    }
    overviewClosingBehaviour() {
        const round = this.#panelPill.panelUI.makeRound;
        round();
        // for some funny reason its better to repeat after a delay
        if (this.#timeoutRoundnessID != null)
            clearTimeout(this.#timeoutRoundnessID);
        this.#timeoutRoundnessID = setTimeout(round.bind(this), ROUND_CORNER_DELAY);
    }
    enableOverviewClosingBehaviour() {
        if (this.#mainOverviewListenerID2 != null)
            Main.overview.disconnect(this.#mainOverviewListenerID2);
        this.#mainOverviewListenerID2 = Main.overview.connect('hiding', this.overviewClosingBehaviour.bind(this));
    }
    disableOverviewClosingBehaviour() {
        if (this.#mainOverviewListenerID2 != null)
            Main.overview.disconnect(this.#mainOverviewListenerID2);
        this.#mainOverviewListenerID2 = null;
        if (this.#timeoutRoundnessID != null)
            clearTimeout(this.#timeoutRoundnessID);
        this.#timeoutRoundnessID = null;
    }
    overviewOpeningBehaviour() {
        Main.overview._overview.first_child.first_child.margin_top = PANEL_Y + Main.panel.height + PANEL_Y;
    }
    enableOverviewOpeningBehaviour() {
        if (this.#mainOverviewListenerID1 != null)
            Main.overview.disconnect(this.#mainOverviewListenerID1);
        this.#mainOverviewListenerID1 = Main.overview.connect('showing', this.overviewOpeningBehaviour.bind(this));
    }
    disableOverviewOpeningBehaviour() {
        if (this.#mainOverviewListenerID1 != null)
            Main.overview.disconnect(this.#mainOverviewListenerID1);
        this.#mainOverviewListenerID1 = null;
    }
}
