import GLib from "gi://GLib";
import PanelPillExtension, { AUTOMOVE_DISTANCE, COMEBACK_MS, FORCE_REACTIVATION_MS, GAP_HEIGHT, REACTIVATION_MS } from "./extension.js";
import PanelUI from "./PanelUI.js";
import { newTopWidget, WidgetType } from './topWidget.js';


export default class Automove {

    readonly #extension: PanelPillExtension;
    _automove: _Automove | undefined;


    constructor(ppe: PanelPillExtension) {
        this.#extension = ppe;
    }

    enable(): PanelPillExtension {
        this._automove = new _Automove(this.#extension);
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

    readonly #extension: PanelPillExtension;
    readonly #ghostHeight: number;
    readonly #ghostWidth: number;
    readonly #ghostX: number;
    readonly #ghostY: number;
    readonly ghostPanel: WidgetType;

    constructor(ppe: PanelPillExtension) {
        this.#extension = ppe;
        this.ghostPanel = newTopWidget(PanelUI.getBox());

        this.#ghostX = PanelUI.getBoxX() - AUTOMOVE_DISTANCE;
        this.#ghostY = GAP_HEIGHT;
        this.#ghostWidth = PanelUI.getBoxWidth() + AUTOMOVE_DISTANCE + AUTOMOVE_DISTANCE;
        this.#ghostHeight = PanelUI.getPanel().height + AUTOMOVE_DISTANCE - GAP_HEIGHT;

        this.moveGhostpanelUp();

        this.enableAutomove();
    }

    destroy() {
        this.disableAutomove();
        this.ghostPanel.destroy();
        if (this._unhideTimeoutID !== undefined) clearTimeout(this._unhideTimeoutID);
    }

    moveGhostpanelUp() {
        this.ghostPanel.x = this.#ghostX;
        this.ghostPanel.y = this.#ghostY;
        this.ghostPanel.height = this.#ghostHeight;
        this.ghostPanel.width = this.#ghostWidth;
        this._ghostIsLowered = false;
    }

    moveGhostpanelDown() {
        this.ghostPanel.x = 0;
        this.ghostPanel.y = this.#ghostY + this.#ghostHeight;
        this.ghostPanel.width = global.screen_width;
        this.ghostPanel.height = this.#ghostHeight;
        this._ghostIsLowered = true;
    }

    enableAutomove() {
        this._mouseOverGhostListener = this.ghostPanel.connect("enter-event", this.onGhostPanelMouseEnter.bind(this));
        this._forceShowListener = PanelUI.getPanel().connect("enter-event", this.onForceShow.bind(this));
    }

    disableAutomove() {
        if (this._mouseOverGhostListener !== undefined)
            this.ghostPanel.disconnect(this._mouseOverGhostListener);
        if (this._forceShowListener !== undefined)
            PanelUI.getPanel().disconnect(this._forceShowListener);
    }

    onGhostPanelMouseEnter() {

        if (this._ghostIsLowered) {
            this.moveGhostpanelUp();
            return;
        }
        this.moveGhostpanelDown();

        PanelUI.easeBoxUp(this.onPanelArriveTop.bind(this));
    }

    onForceShow(){
        this.#extension.panelUI.movePanelDownAutoReactive(FORCE_REACTIVATION_MS);
    }

    onPanelArriveTop() {
        return this.startUnhideTimeout();
    }

    startUnhideTimeout() {
        this.clearUnhideTimeout();
        this._unhideTimeoutID = setTimeout(this.onUnhideTimeout.bind(this), COMEBACK_MS);
    }

    onUnhideTimeout(){
        this.#extension.panelUI.movePanelDownAutoReactive(REACTIVATION_MS);
    }

    clearUnhideTimeout() {
        if (this._unhideTimeoutID !== undefined) {
            clearTimeout(this._unhideTimeoutID);
            return true;
        }
        return false;
    }

}