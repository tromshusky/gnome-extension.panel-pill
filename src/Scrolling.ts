import Clutter from "gi://Clutter";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { Panel } from "resource:///org/gnome/shell/ui/panel.js";
import PanelPillExtension, { DURATION_ASIDE_VERYLONG, DURATION_FADEIN, DURATION_FLICK, DURATION_RETURN } from "./extension.js";
import FlickPanel from "./FlickPanel.js";



export default class Scrolling {
    #mainPanelScrollListenerID1: number | null = null;
    #pill: PanelPillExtension;
    #flickPanel: FlickPanel;

    constructor(pill: PanelPillExtension) {
        this.#pill = pill;
        this.#flickPanel = new FlickPanel();
    }
    enableScrollBehaviour() {
        if (this.#mainPanelScrollListenerID1 != null)
            Main.panel.disconnect(this.#mainPanelScrollListenerID1);
        this.#mainPanelScrollListenerID1 = Main.panel.connect('scroll-event', this.scrollBehaviour.bind(this));
    }

    disableScrollBehaviour() {
        if (this.#mainPanelScrollListenerID1 != null)
            Main.panel.disconnect(this.#mainPanelScrollListenerID1);
        this.#mainPanelScrollListenerID1 = null;
    }

    scrollBehaviour(_: Panel, event: Clutter.Event) {
        const direction = event.get_scroll_direction();
        const strongFlickLeft = event.get_scroll_delta()[0] > 2;
        const strongFlickRight = event.get_scroll_delta()[0] < (-2);

        if (direction === Clutter.ScrollDirection.UP) {
            this.#flickPanel.up(DURATION_FLICK, () => {
                const dur = DURATION_ASIDE_VERYLONG;
                this.#pill.panelUI.temporarySetReactivityFalse(dur + DURATION_RETURN + DURATION_FADEIN);
                this.#flickPanel.up(dur, () => {
                    this.#flickPanel.down(DURATION_RETURN);
                });
            });
        } else if (direction === Clutter.ScrollDirection.DOWN) {
            this.#flickPanel.down(DURATION_FLICK) &&
                this.#pill.panelUI.temporarySetReactivityFalse(DURATION_FLICK + DURATION_FADEIN);
        } else if (direction === Clutter.ScrollDirection.RIGHT) {
            this.#flickPanel.right(DURATION_FLICK);
        } else if (direction === Clutter.ScrollDirection.LEFT) {
            this.#flickPanel.left(DURATION_FLICK);
        } else if (strongFlickLeft) {
            this.#flickPanel.left(DURATION_FLICK, true);
        } else if (strongFlickRight) {
            this.#flickPanel.right(DURATION_FLICK, true);
        }
    }
}