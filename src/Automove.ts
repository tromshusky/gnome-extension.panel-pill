import Clutter from "gi://Clutter";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import PanelPillExtension from "./extension.js";
import { newTopWidget, WidgetType } from './topWidget.js';


export default class Automove {

    #extension: PanelPillExtension;
    #ghostPanel: WidgetType | undefined;
    #enterListener: number | undefined;
    #leaveListener: number | undefined;
    _enterEvent: any;
    _leaveEvent: any;
    _idk: any;

    constructor(ppe: PanelPillExtension) {
        this.#extension = ppe;
    }

    enable():PanelPillExtension {
        this.#ghostPanel = newTopWidget(Main.layoutManager.panelBox);
        this.#ghostPanel.x -= 10;
        this.#ghostPanel.y = 5;
        this.#ghostPanel.width += 20;
        this.#ghostPanel.height = Main.panel.height + 5;
        this.enableAutomove();
        return this.#extension;
    }

    disable():PanelPillExtension {
        this.disableAutomove();
        this.#ghostPanel?.destroy();
        this.#ghostPanel = undefined;
        return this.#extension;
    }

    enableAutomove() {
        this.#enterListener = this.#ghostPanel!.connect("enter-event", this.onEnter1);
        this.#leaveListener = this.#ghostPanel!.connect("leave-event", this.onLeave1);
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
            duration: 300,
            mode: Clutter.AnimationMode.EASE_IN_OUT_BACK,
            // onComplete: callback
        });
    }

    onLeave1(idk: string, event: any) {
        this._leaveEvent = event;
        Main.layoutManager.panelBox.translation_y = 0;
    }

}