import { EasingParamsWithProperties } from "@girs/gnome-shell/extensions/global";
import Clutter from "gi://Clutter";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { AUTOMOVE_MS, GAP_HEIGHT, OPACITY_SOLID, OPACITY_TRANSPARENT } from "./extension.js";

export default class PanelUI {
    static overviewDisconnect(eventID: number) {
        return Main.overview.disconnect(eventID);
    }
    static overviewConnect(eventname: string, fun: () => any): number {
        return Main.overview.connect(eventname, fun);
    }
    static makePlaceInOverview() {
        Main.overview._overview.first_child.first_child.margin_top = Main.layoutManager.panelBox.y + Main.panel.height + Main.layoutManager.panelBox.y;
    }
    static setRoundStyle() {
        Main.panel.set_style("border-radius: " + Main.panel.height + "px;");
    }
    static setNoStyle() {
        Main.panel.set_style("");
    }
    static easeBox(props: EasingParamsWithProperties) {
        return Main.layoutManager.panelBox.ease(props);
    }
    static easeBoxUp(callback?: () => any) {
        const translationDiffY = GAP_HEIGHT - Main.panel.height;
        return Main.layoutManager.panelBox.ease({
            // somehow the library in use doesnt support translation_x and translation_y
            // @ts-expect-error 
            translation_y: translationDiffY,
            duration: AUTOMOVE_MS,
            mode: Clutter.AnimationMode.EASE_IN_OUT_BACK,
            onComplete: () => {
                if (callback) callback();
                Main.layoutManager.panelBox.height = Main.panel.height;
            }
        });
    }
    static getPanel() {
        return Main.panel;
    }
    static getBox() {
        return Main.layoutManager.panelBox;
    }
    static getBoxHeight(): number {
        return Main.layoutManager.panelBox.height;
    }
    static getBoxWidth(): number {
        return Main.layoutManager.panelBox.width;
    }
    static getBoxX(): number {
        return Main.layoutManager.panelBox.x;
    }
    static getBoxY(): number {
        return Main.layoutManager.panelBox.y;
    }
    static shrinkToPill() {
        Main.layoutManager.panelBox.x = global.screen_width * 3 / 8;
        Main.layoutManager.panelBox.width = global.screen_width / 4;
        Main.layoutManager.panelBox.y = 0;
        Main.layoutManager.panelBox.height = GAP_HEIGHT;
    }
    static expandToNormal() {
        Main.layoutManager.panelBox.x = 0;
        Main.layoutManager.panelBox.y = 0;
        Main.layoutManager.panelBox.width = global.screen_width;
        Main.layoutManager.panelBox.height = Main.panel.height;
    }
    static setLowTransparency() {
        Main.layoutManager.panelBox.opacity = OPACITY_TRANSPARENT;
    }
    static setNoTransparency() {
        Main.layoutManager.panelBox.opacity = OPACITY_SOLID;
    }
    static movePanelDown() {
        Main.layoutManager.panelBox.translation_y = 0;
        Main.layoutManager.panelBox.height = GAP_HEIGHT;
    }
};