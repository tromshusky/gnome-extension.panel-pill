// @ts-ignore
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
// @ts-ignore
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import FeatureManager from './gnome-extensions-utils/FeatureManager';
// import Clutter from "gi://Clutter";
// import Gio from 'gi://Gio';

// import Shell from "gi://Shell";
// import St from "gi://St";

const SETTING_ISLANDS = "islands";
const SETTING_PANEL_GAP = "panel-gap";
const SETTING_WINDOW_GAP = "window-gap";
const SETTING_SQUARE_CORNERS = "square-corners";
const SETTING_HIDE_BUTTON = "hide-button";
const SETTING_EASY_DOCK = "easy-dock";
// @ts-ignore
const global = global;


export default class PanelPillExtension extends Extension {
    #featureManager = null;
    WINDOW_GAP = 2;
    PANEL_GAP = 20;

    enable() {
        global._panelpill = this;
    }

    disable() {
        this.featureManager.disableAll();
        this.#featureManager = undefined;


        delete global._panelpill;
    }

    /** @returns {{ get_boolean:(name: string) => boolean }} */
    settings() {
        return super.settings();
    }

    /** @returns {FeatureManager} */
    get featureManager() {
        return this.#featureManager ??= new FeatureManager();
    }

    windowGap() {
        return this.settings().get_boolean(SETTING_WINDOW_GAP) ? this.WINDOW_GAP : 0;
    }

    panelGap() {
        return this.settings().get_boolean(SETTING_PANEL_GAP) ? this.PANEL_GAP : 0;
    }

    setPanelPlacement() {
        Main.layoutManager.panelBox.y = global.screen_height - this.windowGap();
        Main.layoutManager.panelBox.x = this.panelGap();
        Main.layoutManager.panelBox.width = global.screen_width - this.panelGap() - this.panelGap();
        Main.panel.translation_y = this.panelGap() - Main.layoutManager.panelBox.y;
    }
    resetPanelPlacement() {
        Main.layoutManager.panelBox.y = 0;
        Main.layoutManager.panelBox.x = 0;
        Main.layoutManager.panelBox.width = global.screen_width;
        Main.panel.translation_y = 0;
    }

    setPanelStyle() {
        Main.panel.style = "background-color: transparent;";
    }

    resetPanelStyle() {
        Main.panel.style = null;
    }

    setPanelReactivity() {
        Main.panel.reactive = false;
    }
    resetPanelReactivity() {
        Main.panel.reactive = true;
    }

    setIslandsStyle() {
        Main.panel.get_children().map(c => c.style = "background-color: rgba(100,100,100,100); border-radius:999;")
    }

    getIslandFeature() {
        const onEnable = () => undefined;
        const onDisable = () => {
        };

        const el1 = {
            connectable: Main.panel,
            event: "notify",
            callback: () => this.setPanelPlacement()
        };

        const asd = this.featureManager.new(onEnable, onDisable, [el1]);

    }
}
