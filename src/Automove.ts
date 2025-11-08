import Clutter from "gi://Clutter";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import PanelPillExtension, { AUTOMOVE_DISTANCE, AUTOMOVE_MS, GAP_HEIGHT } from "./extension.js";
import { newTopWidget, WidgetType } from './topWidget.js';


export default class Automove {

    #extension: PanelPillExtension;
    #ghostPanel: WidgetType | undefined;
    _enterListener: number | undefined;
    _leaveListener: number | undefined;
    _enterEvent: any;
    _leaveEvent: any;
    _idk: any;

    constructor(ppe: PanelPillExtension) {
        this.#extension = ppe;
    }

    enable(): PanelPillExtension {
        this.#ghostPanel = newTopWidget(Main.layoutManager.panelBox);
        this.#ghostPanel.x -= AUTOMOVE_DISTANCE;
        this.#ghostPanel.y = GAP_HEIGHT;
        this.#ghostPanel.width += AUTOMOVE_DISTANCE + AUTOMOVE_DISTANCE;
        this.#ghostPanel.height = Main.panel.height + (AUTOMOVE_DISTANCE - GAP_HEIGHT);
        this.enableAutomove();
        return this.#extension;
    }

    disable(): PanelPillExtension {
        this.disableAutomove();
        this.#ghostPanel?.destroy();
        this.#ghostPanel = undefined;
        return this.#extension;
    }

    enableAutomove() {
        this._enterListener = this.#ghostPanel!.connect("enter-event", this.onEnter1.bind(this));
        this._leaveListener = this.#ghostPanel!.connect("leave-event", this.onLeave1.bind(this));
        // this.#invisibleWidget.connect("leave-event", this.onLeaveInvi);
    }

    disableAutomove() {

    }

    onEnter1(idk: string, event: any) {
        this._idk = idk;
        this._enterEvent = event;
        Main.layoutManager.panelBox.ease({
            // somehow the library in use doesnt support translation_x and translation_y
            // @ts-expect-error 
            translation_y: - Main.panel.height,
            duration: AUTOMOVE_MS,
            mode: Clutter.AnimationMode.EASE_IN_OUT_BACK,
            // onComplete: callback
        });
    }

    onLeave1(idk: string, event: any) {
        this._leaveEvent = event;
        Main.layoutManager.panelBox.translation_y = 0;
    }

}