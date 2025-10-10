import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { PANEL_HEIGHT, PANEL_OPACITY_HIGH, PANEL_OPACITY_LOW, PANEL_OPACITY_MAX, PANEL_XY_RATIO, PANEL_Y } from "./extension.js";
export default class PanelUI {
    #timeoutFadeinID = null;
    #pill;
    #translation_x;
    constructor(pill) {
        this.#pill = pill;
        this.#translation_x = null;
    }
    enable() {
        this.setPillXAkaLeftRight();
        this.setPillYAkaUpDown();
        this.setPillOpacity();
    }
    disable() {
        this.resetXAkaLeftRight();
        this.resetYAkaUpDown();
        this.resetOpacity();
    }
    resetOpacity() {
        this.resetReactivity(PANEL_OPACITY_MAX);
    }
    resetStyle() {
        Main.panel.set_style("");
    }
    resetYAkaUpDown() {
        Main.layoutManager.panelBox.y = 0;
        Main.layoutManager.panelBox.height = Main.panel.height;
    }
    resetXAkaLeftRight() {
        this.#translation_x = Main.layoutManager.panelBox.translation_x;
        Main.layoutManager.panelBox.translation_x = 0;
        Main.layoutManager.panelBox.x = 0;
        Main.layoutManager.panelBox.width = global.screen_width;
    }
    setPillOpacity() {
        Main.panel.opacity = PANEL_OPACITY_HIGH;
    }
    setPillYAkaUpDown() {
        Main.layoutManager.panelBox.y = PANEL_Y;
        // the panelBox works as a placeholder for maximized windows. height = 0 makes windows maximized until the brim
        // even with panelBox.height = 0 the panel itself stays on the normal height.
        Main.layoutManager.panelBox.height = PANEL_HEIGHT;
    }
    setPillXAkaLeftRight() {
        const new_width = this.calcBestPanelWidth();
        Main.layoutManager.panelBox.width = new_width;
        Main.layoutManager.panelBox.translation_x = 0;
        const new_x = (global.screen_width - new_width) / 2;
        Main.layoutManager.panelBox.x = new_x;
    }
    setPillTranslationXAkaLeftRight(value) {
        Main.layoutManager.panelBox.translation_x = value;
    }
    makeRound() {
        const new_radius = Main.panel.height;
        Main.panel.set_style("border-radius: " + new_radius + "px;");
    }
    calcBestPanelWidth() {
        // this code would work, if the panel didnt resize later (with accessibility and keyboard indicator)
        //        const elem_width = Main.panel.get_children().map(child => child.width).reduce((a, b) => a + b);
        //        const min_width = elem_width + (Main.panel.height * 8);
        // until there is a nicer fix this will do:
        const min_width = Main.panel.height * PANEL_XY_RATIO;
        const new_width = Math.min(min_width, global.screen_width);
        return new_width;
    }
    temporarySetReactivityFalse(duration) {
        if (this.#timeoutFadeinID != null)
            clearTimeout(this.#timeoutFadeinID);
        this.#timeoutFadeinID = setTimeout(this.resetReactivity.bind(this), duration);
        this.setPanelReactivity(false);
        Main.panel.opacity = PANEL_OPACITY_LOW;
    }
    resetReactivity(opacity = PANEL_OPACITY_HIGH) {
        if (this.#timeoutFadeinID != null)
            clearTimeout(this.#timeoutFadeinID);
        this.#timeoutFadeinID = null;
        this.setPanelReactivity(true);
        Main.panel.opacity = opacity;
    }
    setPanelReactivity(value) {
        Main.panel.get_children().map(e => {
            e.get_children().map(f => { f.first_child.reactive = value; });
        });
    }
}
