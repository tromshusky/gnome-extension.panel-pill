import GLib from 'gi://GLib';
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import PanelPillExtension, { PANEL_HEIGHT, PANEL_OPACITY_HIGH, PANEL_OPACITY_LOW, PANEL_OPACITY_MAX, PANEL_XY_RATIO, PANEL_Y, STILL_ON_SCREEN_PIXEL } from "./extension.js";
import Clutter from "gi://Clutter";


export default class PanelUI {
    #timeoutFadeinID: GLib.Source | null = null;
    #pill: PanelPillExtension;


    constructor(pill: PanelPillExtension) {
        this.#pill = pill;
    }

    enable() {
        this.setPillXAkaLeftRight();
        this.setPillYAkaUpDown();
        this.#setPillOpacity();
    }

    disable() {
        this.resetXAkaLeftRight();
        this.resetYAkaUpDown();
        this.#resetOpacity();
        this.#resetStyle();
    }

    resetYAkaUpDown() {
        Main.layoutManager.panelBox.y = 0;
        Main.layoutManager.panelBox.height = Main.panel.height;
    }

    resetXAkaLeftRight() {
        Main.layoutManager.panelBox.translation_x = 0;
        Main.layoutManager.panelBox.x = 0;
        Main.layoutManager.panelBox.width = global.screen_width;
    }

    moveUpDown(translationY: number, duration: number, callback?: () => void) {
        Main.layoutManager.panelBox.ease({
            // somehow the library in use doesnt support translation_x and translation_y
            // @ts-expect-error 
            translation_y: translationY,
            duration: duration,
            mode: Clutter.AnimationMode.EASE_IN_OUT_BACK,
            onComplete: callback
        });
    }

    moveUp(duration: number, callback?: () => void) {
        Main.layoutManager.panelBox.ease({
            // somehow the library in use doesnt support translation_x and translation_y
            // @ts-expect-error 
            translation_y: this.getTranslationUp(),
            duration: duration,
            mode: Clutter.AnimationMode.EASE_IN_OUT_BACK,
            onComplete: callback
        });
    }

    moveDown(duration: number, callback?: () => void) {
        Main.layoutManager.panelBox.ease({
            // somehow the library in use doesnt support translation_x and translation_y
            // @ts-expect-error 
            translation_y: 0,
            duration: duration,
            mode: Clutter.AnimationMode.EASE_IN_OUT_BACK,
            onComplete: callback
        });
    }

    moveLeftRight(relative_x: number, duration: number, callback?: () => void) {
        Main.layoutManager.panelBox.ease({
            // somehow the library in use doesnt support translation_x and translation_y
            // @ts-expect-error 
            translation_x: relative_x,
            duration: duration,
            mode: Clutter.AnimationMode.EASE_IN_OUT_BACK,
            onComplete: callback
        });
    }

    setHeightOversize(enable: boolean) {
        Main.layoutManager.panelBox.height = PANEL_HEIGHT + (enable ? 1 : 0);
    }

    getRightEnd() {
        return (Main.layoutManager.panelBox.x - PANEL_Y);
    }

    isVisuallyAtTheRightEnd() {
        return Main.layoutManager.panelBox.translation_x === this.getRightEnd();
    }

    isVisuallyAtTheLeftEnd() {
        return Main.layoutManager.panelBox.translation_x === this.getLeftEnd();
    }

    getLeftEnd() {
        return (PANEL_Y - Main.layoutManager.panelBox.x);
    }

    getTranslationUp() {
        return STILL_ON_SCREEN_PIXEL - Main.layoutManager.panelBox.y - Main.panel.height;
    }

    hasNegativeTranslationY() {
        return Main.layoutManager.panelBox.translation_y < 0;
    }

    isVisuallyRightOrMid() {
        return (Main.layoutManager.panelBox.translation_x >= 0);
    }

    isVisuallyLeftOrMid() {
        return (Main.layoutManager.panelBox.translation_x <= 0);
    }

    isVisuallyDown() {
        return (Main.layoutManager.panelBox.translation_y == 0);
    }

    #resetOpacity() {
        this.#resetReactivityToTrue(PANEL_OPACITY_MAX);
    }

    #resetStyle() {
        Main.panel.set_style("");
    }

    #setPillOpacity() {
        Main.panel.opacity = PANEL_OPACITY_HIGH;
    }

    setPillYAkaUpDown() {
        Main.layoutManager.panelBox.y = PANEL_Y;
        // the panelBox works as a placeholder for maximized windows. height = 0 makes windows maximized until the brim
        // even with panelBox.height = 0 the panel itself stays on the normal height.
        Main.layoutManager.panelBox.height = PANEL_HEIGHT;
    }

    #getPillTranslationBasedOnMouse(): number {
        const getP = global.get_pointer();
        const [mouse_x] = getP;
        const mouseLeft = mouse_x < (global.screen_width / 3);
        const mouseRight = mouse_x > (global.screen_width / 1.5);
        // @ts-expect-error
        global._panelpillPointer = getP;
        return mouseLeft ? this.getPillTranslationLEFT() :
            mouseRight ? this.getPillTranslationRIGHT() :
                this.getPillTranslationX0();
    }

    setPillXAkaLeftRight(basedOnMouse?: boolean) {
        const new_width = this.#calcBestWidth();
        Main.layoutManager.panelBox.width = new_width;
        const new_x = (global.screen_width - new_width) / 2;
        // we have to set x before we calculate translation_x
        Main.layoutManager.panelBox.x = new_x;
        // now we can calculate translation_x
        const new_translation = basedOnMouse ? this.#getPillTranslationBasedOnMouse() : 0;
        Main.layoutManager.panelBox.translation_x = new_translation;
        // @ts-expect-error
        global._panelpillBasedMouse = basedOnMouse;
        // @ts-expect-error
        global._panelpillTransX = Main.layoutManager.panelBox.translation_x;
        // @ts-expect-error
        global._panelpillTransss = new_translation;
    }

    getPillTranslationLEFT() {
        // @ts-expect-error
        global._panelpillTrString = "left";
        return (- Main.layoutManager.panelBox.x);
    }

    getPillTranslationRIGHT() {
        // @ts-expect-error
        global._panelpillTrString = "right";
        return Main.layoutManager.panelBox.x;
    }

    getPillTranslationX0() {
        // @ts-expect-error
        global._panelpillTrString = "zero";
        return 0;
    }


    makeRound() {
        this.#setRoundStyle();
    }

    #calcBestWidth() {
        // this code would work, if the panel didnt resize later (with accessibility and keyboard indicator)
        //        const elem_width = Main.panel.get_children().map(child => child.width).reduce((a, b) => a + b);
        //        const min_width = elem_width + (Main.panel.height * 8);
        // until there is a nicer fix this will do:
        const min_width = Main.panel.height * PANEL_XY_RATIO;
        const new_width = Math.min(min_width, global.screen_width);
        return new_width;
    }

    temporarySetReactivityFalse(duration: number) {
        if (this.#timeoutFadeinID != null)
            clearTimeout(this.#timeoutFadeinID);
        this.#timeoutFadeinID = setTimeout(this.#resetReactivityToTrue.bind(this), duration);
        this.setReactivity(false);
    }

    #resetReactivityToTrue(opacity: number = PANEL_OPACITY_HIGH) {
        if (this.#timeoutFadeinID != null)
            clearTimeout(this.#timeoutFadeinID);
        this.#timeoutFadeinID = null;
        this.setReactivity(true);
        Main.panel.opacity = opacity;
    }

    setReactivity(rea: boolean) {
        const scrollObject = this.#pill.scrolling.getScrollObject();
        Main.panel.get_children().map(e => {
            e.get_children().map(f => {
                const g = f.first_child;
                if (scrollObject !== g)
                    g.reactive = rea;
                const h = g.first_child;
                if (h != null) {
                    h.get_children().map(i => {
                        if (scrollObject !== i)
                            i.reactive = rea;
                    });
                }
            });
        });
        this.#setRoundStyle();
        if (scrollObject !== Main.panel)
            Main.panel.reactive = rea;
        Main.panel.opacity = rea ? PANEL_OPACITY_HIGH : PANEL_OPACITY_LOW;
    }

    #setRoundStyle() {
        Main.panel.set_style("border-radius: " + Main.panel.height + "px;");
    }
}
