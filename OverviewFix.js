import * as Main from "resource:///org/gnome/shell/ui/main.js";

export default class OverviewFix {

    #timeoutRoundnessID = null;
    #mainOverviewListenerID1 = null;
    #mainOverviewListenerID2 = null;

    makePanelRound() {
        const new_radius = Main.panel.height;
        const make_round = () => {
            Main.panel.set_style("border-radius: " + new_radius + "px;");
        };

        make_round();

        // for some funny reason its better to repeat after a delay
        if (this.#timeoutRoundnessID != null)
            clearTimeout(this.#timeoutRoundnessID);
        this.#timeoutRoundnessID = setTimeout(make_round, 1000);
    }

    enableOverviewClosingBehaviour() {
        if (this.#mainOverviewListenerID2 != null)
            Main.overview.disconnect(this.#mainOverviewListenerID2);
        this.#mainOverviewListenerID2 = Main.overview.connect('hiding', this.makePanelRound.bind(this));
    }

    disableOverviewClosingBehaviour() {
        if (this.#mainOverviewListenerID2 != null)
            Main.overview.disconnect(this.#mainOverviewListenerID2);
        this.#mainOverviewListenerID2 = null;
    }

    overviewOpeningBehaviour() {
        Main.overview._overview.first_child.first_child.margin_top = global._panelpill.PANEL_Y + Main.panel.height + global._panelpill.PANEL_Y;
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