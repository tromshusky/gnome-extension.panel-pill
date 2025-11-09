import GLib from "gi://GLib";
import PanelPillExtension, { AUTOMOVE_DISTANCE, COMEBACK_MS, GAP_HEIGHT } from "./extension.js";
import PanelUI from "./PanelUI.js";
import { newTopWidget, WidgetType } from './topWidget.js';


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
    }

    disableAutomove() {
        if (this._mouseOverGhostListener !== undefined)
            this.ghostPanel.disconnect(this._mouseOverGhostListener);
        if (this._forceShowListener !== undefined)
            PanelUI.getPanel().disconnect(this._forceShowListener);
    }

    onGhostPanelMouseEnter() {

        if (this._ghostIsLowered) {
            this.setGhostYUp();
            return;
        }
        this.setGhostYDown();

        PanelUI.easeBoxUp(this.onPanelArriveTop.bind(this));
    }

    onPanelArriveTop() {
        if (this._unhideTimeoutID !== undefined) clearTimeout(this._unhideTimeoutID);
        this._unhideTimeoutID = setTimeout(PanelUI.movePanelDown, COMEBACK_MS);
    }

}