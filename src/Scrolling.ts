import Clutter from "gi://Clutter";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { Panel } from "resource:///org/gnome/shell/ui/panel.js";
import PanelPillExtension, { DOUBLE_SCROLL_DELAY, DURATION_ASIDE_VERYLONG, DURATION_FLICK, DURATION_RETURN } from "./extension.js";
import FlickPanel from "./FlickPanel.js";
import { newScrollWidget } from "./scrollWidget.js";
import GLib from "gi://GLib";


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

    enableScrollBehaviour() {
        this.getScrollObject();
        if (this.#mainPanelScrollListenerID1 != null)
            this.getScrollObject().disconnect(this.#mainPanelScrollListenerID1);
        this.#mainPanelScrollListenerID1 = this.getScrollObject().connect('scroll-event', this.#debouncedScrollBehaviour.bind(this));
    }

    disableScrollBehaviour() {
        if (this.#mainPanelScrollListenerID1 != null)
            this.getScrollObject().disconnect(this.#mainPanelScrollListenerID1);
        this.#mainPanelScrollListenerID1 = null;
    }

    getScrollObject() {
        if (this.#scrollObject === undefined) {
            this.#scrollObject = newScrollWidget();
        }
        if (this.#scrollObject.get_parent() == null)
            Main.layoutManager.panelBox.get_parent()?.add_child(this.#scrollObject);
        return this.#scrollObject;
    }


    #getScrollObjectClockDate(): Clutter.Actor {
        return Main.panel.
            get_children().
            filter(c => c.name === "panelCenter")[0].
            first_child.
            first_child;
    }

    #unblockDoubleScroll() {
        if (this.#doubleScrollBlockerTimoutID != null) {
            clearTimeout(this.#doubleScrollBlockerTimoutID);
            this.#doubleScrollBlockerTimoutID = null;
        }
    }


    #debouncedScrollBehaviour(_: Panel, event: Clutter.Event) {
        if (this.#doubleScrollBlockerTimoutID != null) return;
        if (this.#scrollBehaviour(event))
            this.#doubleScrollBlockerTimoutID = setTimeout(this.#unblockDoubleScroll.bind(this), DOUBLE_SCROLL_DELAY);
    }

    #scrollBehaviour(event: Clutter.Event): boolean {

        const direction = event.get_scroll_direction();
        const strongFlickLeft = event.get_scroll_delta()[0] > 2;
        const strongFlickRight = event.get_scroll_delta()[0] < (-2);

        const realScrollDown = Clutter.ScrollDirection.UP;
        const realScrollUp = Clutter.ScrollDirection.DOWN;
        const realScrollRight = Clutter.ScrollDirection.LEFT;
        const realScrollLeft = Clutter.ScrollDirection.RIGHT;

        if (direction === realScrollUp) {
            this.#flickPanelUp();
        } else if (direction === realScrollDown) {
            this.#flickPanelDown();
        } else if (direction === realScrollRight) {
            this.#flickPanel.right(DURATION_FLICK);
        } else if (direction === realScrollLeft) {
            this.#flickPanel.left(DURATION_FLICK);
        } else if (strongFlickLeft) {
            this.#flickPanel.leftStrong(DURATION_FLICK);
        } else if (strongFlickRight) {
            this.#flickPanel.rightStrong(DURATION_FLICK);
        } else {
            return false;
        }
        return true;
    }

    #flickPanelUp() {
        if (this.#panelHideStrength >= 2) return;
        if (this.#panelHideStrength == 0) {
            this.#panelPill.panelUI.setReactivity(false);
        } else if (this.#panelHideStrength == 1) {
            this.#flickPanel.up(DURATION_FLICK, () => {
                const dur = DURATION_ASIDE_VERYLONG;
                this.#panelPill.panelUI.temporarySetReactivityFalse(dur + DURATION_RETURN);
                this.#flickPanel.up(dur, () => {
                    this.#flickPanel.down(DURATION_RETURN);
                });
            });
        }
        this.#panelHideStrength++;
    }

    #flickPanelDown() {
        if (this.#panelHideStrength <= 0) return;
        if (this.#panelHideStrength == 2) {
            this.#flickPanel.down(DURATION_FLICK);
            this.#panelPill.panelUI.setReactivity(false);
        } else if (this.#panelHideStrength == 1) {
            this.#panelPill.panelUI.temporarySetReactivityFalse(DURATION_FLICK);
        }
        this.#panelHideStrength--;
    }

}