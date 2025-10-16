import Clutter from "gi://Clutter";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { Panel } from "resource:///org/gnome/shell/ui/panel.js";
import PanelPillExtension, { DOUBLE_SCROLL_DELAY, DURATION_ASIDE_VERYLONG, DURATION_FADEIN, DURATION_FLICK, DURATION_RETURN, PANEL_HEIGHT } from "./extension.js";
import FlickPanel from "./FlickPanel.js";
import GLib from "gi://GLib";
import St from "gi://St";



export default class Scrolling {
    #doubleScrollBlockerTimoutID: GLib.Source | null = null;
    #flickPanel: FlickPanel;
    #mainPanelScrollListenerID1: number | null = null;
    #panelHideStrength: number = 0;
    #panelPill: PanelPillExtension;
    #scrollObject: Clutter.Actor | undefined;

    constructor(pill: PanelPillExtension) {
        this.#panelPill = pill;
        this.#flickPanel = new FlickPanel(pill);
    }

    getScrollObject() {
        /*
        if (this.#scrollObject !== undefined) return this.#scrollObject;
        this.#scrollObject = Main.panel.
            get_children().
            filter(c => c.name === "panelCenter")[0].
            first_child.
            first_child;
            */
        if (this.#scrollObject === undefined) {
            this.#scrollObject = new St.Widget();
            this.#scrollObject.x = 0;
            this.#scrollObject.y = 0;
            this.#scrollObject.height = PANEL_HEIGHT;
            this.#scrollObject.width = global.screen_width;
            this.#scrollObject.reactive = true;
        }
        if (this.#scrollObject.get_parent() == null)
            Main.layoutManager.panelBox.get_parent()?.add_child(this.#scrollObject);
        return this.#scrollObject;
    }

    enableScrollBehaviour() {
        this.getScrollObject();
        if (this.#mainPanelScrollListenerID1 != null)
            this.getScrollObject().disconnect(this.#mainPanelScrollListenerID1);
        this.#mainPanelScrollListenerID1 = this.getScrollObject().connect('scroll-event', this.scrollBehaviour.bind(this));
    }

    disableScrollBehaviour() {
        if (this.#mainPanelScrollListenerID1 != null)
            this.getScrollObject().disconnect(this.#mainPanelScrollListenerID1);
        this.#mainPanelScrollListenerID1 = null;
    }


    unblockDoubleScroll() {
        if (this.#doubleScrollBlockerTimoutID != null) {
            clearTimeout(this.#doubleScrollBlockerTimoutID);
            this.#doubleScrollBlockerTimoutID = null;
        }
    }

    scrollBehaviour(_: Panel, event: Clutter.Event) {

        if (this.#doubleScrollBlockerTimoutID == null) {
            this.#doubleScrollBlockerTimoutID = setTimeout(this.unblockDoubleScroll.bind(this), DOUBLE_SCROLL_DELAY);

            const direction = event.get_scroll_direction();
            const strongFlickLeft = event.get_scroll_delta()[0] > 2;
            const strongFlickRight = event.get_scroll_delta()[0] < (-2);

            const realScrollDown = Clutter.ScrollDirection.UP;
            const realScrollUp = Clutter.ScrollDirection.DOWN;
            const realScrollRight = Clutter.ScrollDirection.LEFT;
            const realScrollLeft = Clutter.ScrollDirection.RIGHT;

            if (direction === realScrollUp) {
                if (this.#panelHideStrength == 0) {
                    this.#panelPill.panelUI.setReactivity(false);
                    this.#panelHideStrength = 1;
                } else if (this.#panelHideStrength == 1) {
                    this.#flickPanel.up(DURATION_FLICK, () => {
                        const dur = DURATION_ASIDE_VERYLONG;
                        this.#panelPill.panelUI.temporarySetReactivityFalse(dur + DURATION_RETURN + DURATION_FADEIN);
                        this.#flickPanel.up(dur, () => {
                            this.#flickPanel.down(DURATION_RETURN);
                        });
                    });
                    this.#panelHideStrength = 2;
                }
            } else if (direction === realScrollDown) {
                if (this.#panelHideStrength == 2) {
                    this.#flickPanel.down(DURATION_FLICK);
                    this.#panelHideStrength = 1;
                    this.#panelPill.panelUI.setReactivity(false);
                } else if (this.#panelHideStrength == 1) {
                    this.#panelPill.panelUI.temporarySetReactivityFalse(DURATION_FLICK + DURATION_FADEIN);
                    this.#panelHideStrength = 0;
                }
            } else if (direction === realScrollRight) {
                this.#flickPanel.right(DURATION_FLICK);
            } else if (direction === realScrollLeft) {
                this.#flickPanel.left(DURATION_FLICK);
            } else if (strongFlickLeft) {
                this.#flickPanel.left(DURATION_FLICK, true);
            } else if (strongFlickRight) {
                this.#flickPanel.right(DURATION_FLICK, true);
            } else {
                this.unblockDoubleScroll();
            }
        }
    }

}