import Clutter from "gi://Clutter";
import GLib from "gi://GLib";
import PanelPillExtension, { AUTOMOVE_DISTANCE, AUTOMOVE_MS, COMEBACK_MS, GAP_HEIGHT } from "./extension.js";
import { newTopWidget, WidgetType } from './topWidget.js';
import PanelUI from "./PanelUI.js";


export default class Automove {

    #extension: PanelPillExtension;
    _automove: _Automove | undefined;


    constructor(ppe: PanelPillExtension) {
        this.#extension = ppe;
    }

    enable(): PanelPillExtension {
        this._automove = new _Automove();
        return this.#extension;
    }

    disable(): PanelPillExtension {
        this._automove?.destroy();
        return this.#extension;
    }
}

class _Automove {

    _forceShowListener: number | undefined;
    _mouseOverGhostListener: number | undefined;
    _unhideTimeoutID: GLib.Source | undefined;
    _ghostIsLowered = false;

    readonly #ghostHeight: number;
    readonly #ghostWidth: number;
    readonly #ghostX: number;
    readonly #ghostY: number;
    readonly ghostPanel: WidgetType;

    constructor() {
        this.ghostPanel = newTopWidget(PanelUI.getBox());

        this.#ghostX = PanelUI.getBoxX() - AUTOMOVE_DISTANCE;
        this.#ghostY = GAP_HEIGHT;
        this.#ghostWidth = PanelUI.getBoxWidth() + AUTOMOVE_DISTANCE + AUTOMOVE_DISTANCE;
        this.#ghostHeight = PanelUI.getPanel().height + AUTOMOVE_DISTANCE - GAP_HEIGHT;

        this.setGhostYUp();

        this.enableAutomove();
    }

    destroy() {
        this.disableAutomove();
        this.ghostPanel.destroy();
    }

    setGhostYUp() {
        this.ghostPanel.x = this.#ghostX;
        this.ghostPanel.y = this.#ghostY;
        this.ghostPanel.height = this.#ghostHeight;
        this.ghostPanel.width = this.#ghostWidth;
        this._ghostIsLowered = false;
    }

    setGhostYDown() {
        this.ghostPanel.x = 0;
        this.ghostPanel.y = this.#ghostY + this.#ghostHeight;
        this.ghostPanel.width = global.screen_width;
        this.ghostPanel.height = this.#ghostHeight;
        this._ghostIsLowered = true;
    }

    enableAutomove() {
        this._mouseOverGhostListener = this.ghostPanel.connect("enter-event", this.onGhostPanelMouseEnter.bind(this));
        this._forceShowListener = PanelUI.getPanel().connect("enter-event", PanelUI.movePanelDown);
        // this.#invisibleWidget.connect("leave-event", this.onLeaveInvi);
    }

    disableAutomove() {
        //TODO
    }

    onGhostPanelMouseEnter() {

        if (this._ghostIsLowered) {
            this.setGhostYUp();
            return;
        }
        this.setGhostYDown();

        PanelUI.easeBox({
            // somehow the library in use doesnt support translation_x and translation_y
            // @ts-expect-error 
            translation_y: GAP_HEIGHT - Main.panel.height,
            duration: AUTOMOVE_MS,
            mode: Clutter.AnimationMode.EASE_IN_OUT_BACK,
            onComplete: this.onPanelArriveTop.bind(this)
        });
    }

    onPanelArriveTop() {
        if (this._unhideTimeoutID !== undefined) clearTimeout(this._unhideTimeoutID);
        this._unhideTimeoutID = setTimeout(PanelUI.movePanelDown, COMEBACK_MS);
    }

}