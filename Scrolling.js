import Clutter from "gi://Clutter";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { DOUBLE_SCROLL_DELAY, DURATION_ASIDE_VERYLONG, DURATION_FADEIN, DURATION_FLICK, DURATION_RETURN } from "./extension.js";
import FlickPanel from "./FlickPanel.js";
export default class Scrolling {
    #doubleScrollBlockerTimoutID = null;
    #flickPanel;
    #mainPanelScrollListenerID1 = null;
    #panelHideStrength = 0;
    #panelPill;
    constructor(pill) {
        this.#panelPill = pill;
        this.#flickPanel = new FlickPanel(pill);
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
    unblockDoubleScroll() {
        if (this.#doubleScrollBlockerTimoutID != null) {
            clearTimeout(this.#doubleScrollBlockerTimoutID);
            this.#doubleScrollBlockerTimoutID = null;
        }
    }
    scrollBehaviour(_, event) {
        const direction = event.get_scroll_direction();
        const strongFlickLeft = event.get_scroll_delta()[0] > 2;
        const strongFlickRight = event.get_scroll_delta()[0] < (-2);
        const realScrollDown = Clutter.ScrollDirection.UP;
        const realScrollUp = Clutter.ScrollDirection.DOWN;
        const realScrollRight = Clutter.ScrollDirection.LEFT;
        const realScrollLeft = Clutter.ScrollDirection.RIGHT;
        if (direction === realScrollUp) {
            if (this.#doubleScrollBlockerTimoutID == null) {
                this.#doubleScrollBlockerTimoutID = setTimeout(this.unblockDoubleScroll.bind(this), DOUBLE_SCROLL_DELAY);
                if (this.#panelHideStrength == 0) {
                    this.#panelPill.panelUI.setReactivity(false);
                    this.#panelHideStrength = 1;
                }
                else if (this.#panelHideStrength == 1) {
                    this.#flickPanel.up(DURATION_FLICK, () => {
                        const dur = DURATION_ASIDE_VERYLONG;
                        this.#panelPill.panelUI.temporarySetReactivityFalse(dur + DURATION_RETURN + DURATION_FADEIN);
                        this.#flickPanel.up(dur, () => {
                            this.#flickPanel.down(DURATION_RETURN);
                        });
                    });
                    this.#panelHideStrength = 2;
                }
            }
        }
        else if (direction === realScrollDown) {
            if (this.#doubleScrollBlockerTimoutID == null) {
                this.#doubleScrollBlockerTimoutID = setTimeout(this.unblockDoubleScroll.bind(this), DOUBLE_SCROLL_DELAY);
                if (this.#panelHideStrength == 2) {
                    this.#flickPanel.down(DURATION_FLICK);
                    this.#panelHideStrength = 1;
                    this.#panelPill.panelUI.setReactivity(false);
                }
                else if (this.#panelHideStrength == 1) {
                    this.#panelPill.panelUI.temporarySetReactivityFalse(DURATION_FLICK + DURATION_FADEIN);
                    this.#panelHideStrength = 0;
                }
            }
        }
        else if (direction === realScrollRight) {
            this.#flickPanel.right(DURATION_FLICK);
        }
        else if (direction === realScrollLeft) {
            this.#flickPanel.left(DURATION_FLICK);
        }
        else if (strongFlickLeft) {
            this.#flickPanel.left(DURATION_FLICK, true);
        }
        else if (strongFlickRight) {
            this.#flickPanel.right(DURATION_FLICK, true);
        }
    }
}
