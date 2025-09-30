"use strict";
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import Scrolling from './Scrolling.js';
import OverviewFix from './OverviewFix.js';

// import Shell from "gi://Shell";
// import St from "gi://St";

const PANEL_OPACITY_HIGH = 225;
const PANEL_OPACITY_MAX = 255;
const PANEL_OPACITY_LOW = 100;
const PANEL_RATIO = 20;

const set_panel_reactivity = (value) => {
    Main.panel.get_children().map(e => {
        e.get_children().map(f => { f.first_child.reactive = value; });
    });
}
const get_panel_width = () => {
    // this code would work, if the panel didnt resize (with accessibility and keyboard indicator)
    //        const elem_width = Main.panel.get_children().map(child => child.width).reduce((a, b) => a + b);
    //        const min_width = elem_width + (Main.panel.height * 8);
    // until there is a nicer fix this will do:
    const min_width = Main.panel.height * PANEL_RATIO;
    const new_width = Math.min(min_width, global.screen_width);
    return new_width;
}

export default class PanelPillExtension extends Extension {
    #timeoutFadeinID = null;

    #scrolling = null;
    #overviewFix = null;

    enable() {
        global._panelpill = {
            PANEL_Y : 4,
        };
        if (this.#scrolling == null)
            this.#scrolling = new Scrolling();
        if (this.#overviewFix == null)
            this.#overviewFix = new OverviewFix();
        this.#scrolling.enableScrollBehaviour();
        this.#overviewFix.enableOverviewOpeningBehaviour();
        this.#overviewFix.enableOverviewClosingBehaviour();
        this.resizeToPill();
    }

    disable() {
        this.#scrolling.disableScrollBehaviour();
        this.#overviewFix.disableOverviewOpeningBehaviour();
        this.#overviewFix.disableOverviewClosingBehaviour();
        this.resizeBackToVanilla();
        Main.panel.opacity = PANEL_OPACITY_MAX;
    }


    resizeToPill() {
        const new_width = get_panel_width();
        const new_x = (global.screen_width - new_width) / 2;
        Main.layoutManager.panelBox.x = new_x;
        Main.layoutManager.panelBox.y = global._panelpill.PANEL_Y;
        Main.layoutManager.panelBox.width = new_width;
        // the panelBox works as a placeholder for maximized windows. height = 0 makes windows maximized until the brim
        // with height = 0 the panel itself stays on the normal height.
        Main.layoutManager.panelBox.height = 0;
        Main.panel.opacity = PANEL_OPACITY_HIGH;
        this.makePanelRound();
    }

    resizeBackToVanilla() {
        Main.layoutManager.panelBox.x = 0;
        Main.layoutManager.panelBox.y = 0;
        Main.layoutManager.panelBox.width = global.screen_width;
        Main.panel.set_style("");
    }

    temporarySetReactivityFalse(duration) {
        set_panel_reactivity(false);
        Main.panel.opacity = PANEL_OPACITY_LOW;
        if (this.#timeoutFadeinID != null)
            clearTimeout(this.#timeoutFadeinID);
        this.#timeoutFadeinID = setTimeout(this.resetReacticity.bind(this), duration);
    }

    resetReacticity() {
        if (this.#timeoutFadeinID)
            clearTimeout(this.#timeoutFadeinID);
        this.#timeoutFadeinID = null;
        set_panel_reactivity(true);
        Main.panel.opacity = PANEL_OPACITY_HIGH;
    }
}