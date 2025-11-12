import { EasingParamsWithProperties } from "@girs/gnome-shell/extensions/global";
import Clutter from "gi://Clutter";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import PanelPillExtension, { AUTOMOVE_MS, GAP_PILL_HEIGHT, GAP_WINDOW_HEIGHT, LOW_OPACITY as OPACITY_LOW, OPACITY_SOLID, OPACITY_TRANSPARENT, PANEL_WIDTH_PERCENT, REACTIVATION_MS } from "./extension.js";


export default class PanelUI {
    #extension: PanelPillExtension;

    _inreactiveTimer: any;

    constructor(ppe: PanelPillExtension) {
        this.#extension = ppe;
    }

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
        const translationDiffY = GAP_WINDOW_HEIGHT - Main.panel.height;
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
        Main.layoutManager.panelBox.x = global.screen_width * (100 - PANEL_WIDTH_PERCENT) / 100 / 2;
        Main.layoutManager.panelBox.width = global.screen_width * PANEL_WIDTH_PERCENT / 100;
        Main.layoutManager.panelBox.y = 0;
        Main.layoutManager.panelBox.height = GAP_WINDOW_HEIGHT;
        Main.panel.translation_y = GAP_PILL_HEIGHT;
    }
    static expandToNormal() {
        Main.layoutManager.panelBox.x = 0;
        Main.layoutManager.panelBox.y = 0;
        Main.layoutManager.panelBox.width = global.screen_width;
        Main.layoutManager.panelBox.height = Main.panel.height;
        Main.panel.translation_y = 0;
    }
    static setFactoryTransparency() {
        return PanelUI.setNoTransparency();
    }
    static setPillTransparency() {
        return PanelUI.setLowTransparency();
    }
    static setLowTransparency() {
        Main.layoutManager.panelBox.opacity = OPACITY_TRANSPARENT;
    }
    static setNoTransparency() {
        Main.layoutManager.panelBox.opacity = OPACITY_SOLID;
    }
    static setHighTransparency() {
        Main.layoutManager.panelBox.opacity = OPACITY_LOW;
    }
    /**
     * moves the panel down into normal position and sets it temporary inreactive
     * the panel has high opacity while not reactive
     * @param reactivationTime time until panel turns reactive
     */
    movePanelDownAutoReactive(reactivationTime: number) {
        if (Main.layoutManager.panelBox.translation_y === 0) return false;
        Main.layoutManager.panelBox.translation_y = 0;
        Main.layoutManager.panelBox.height = GAP_WINDOW_HEIGHT;
        this.#setInreactiveTimer(reactivationTime);
        return true;
    }

    /**
     * sets the panel inreactive for a defined time
     */
    #setInreactiveTimer(reactivationTime: number) {
        PanelUI.setReactiveFalse();
        if (this._inreactiveTimer !== undefined)
            clearTimeout(this._inreactiveTimer);
        this._inreactiveTimer = setTimeout(PanelUI.setReactiveTrue, reactivationTime);
    }

    static #foreachPanelButton(buttonFun: (button: Clutter.Actor) => void) {
        const threeGroups = Main.panel.get_children();
        threeGroups.forEach(group => {
            const buttonBoxes = group.get_children();
            buttonBoxes.forEach(buttonBox => {
                buttonFun(buttonBox.first_child);
            })
        });
    }

    static setReactiveTrue(): void {
        Main.panel.reactive = true;
        PanelUI.#foreachPanelButton(button => { button.reactive = true; });
        PanelUI.setLowTransparency();
    }

    static setReactiveFalse(): void {
        Main.panel.reactive = false;
        PanelUI.#foreachPanelButton(button => { button.reactive = false; });
        PanelUI.setHighTransparency();
    }
};