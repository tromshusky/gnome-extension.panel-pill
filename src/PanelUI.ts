import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { GAP_HEIGHT, OPACITY_SOLID, OPACITY_TRANSPARENT } from "./extension.js";
import { EasingParamsWithProperties } from "@girs/gnome-shell/extensions/global";

export default class PanelUI {
    static setRoundStyle() {
        Main.panel.set_style("border-radius: " + Main.panel.height + "px;");
    }
    static setNoStyle() {
        Main.panel.set_style("");
    }
    static easeBox(props: EasingParamsWithProperties){
        return Main.layoutManager.panelBox.ease(props);
    }
    static getPanel(){
        return Main.panel;
    }
    static getBox(){
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
    }
};