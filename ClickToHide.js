import * as Main from "resource:///org/gnome/shell/ui/main.js";

const TIEMOUT_HIDDEN = 7000;


export default class ClickToHide {
    #timeoutVanishID = null;
    #mainPanelClickListenerID1 = null;

    clickToHideBehaviour() {
        Main.panel.hide();

        if (this.#timeoutVanishID != null)
            clearTimeout(this.#timeoutVanishID);

        this.#timeoutVanishID = setTimeout(() => {
            Main.panel.show();
        }, TIEMOUT_HIDDEN);

        this.temporarySetReactivityFalse(TIEMOUT_HIDDEN + DURATION_FADEIN);

        return Clutter.EVENT_STOP; // Prevent further handling of the event
    }

    enableClickToHideBehaviour() {
        if (this.#mainPanelClickListenerID1 != null)
            Main.panel.disconnect(this.#mainPanelClickListenerID1);
        this.#mainPanelClickListenerID1 = Main.panel.connect('button-press-event', this.clickToHideBehaviour.bind(this));
    }
    disableClickToHideBehaviour() {
        this.resetReacticity();

        if (this.#mainPanelClickListenerID1 != null)
            Main.panel.disconnect(this.#mainPanelClickListenerID1);
        this.#mainPanelClickListenerID1 = null;

        if (this.#timeoutVanishID != null)
            clearTimeout(this.#timeoutVanishID);
        this.#timeoutVanishID = null;

        this.resetReacticity();
    }

}