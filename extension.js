// @ts-ignore
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
// @ts-ignore
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import FeatureManager from './gnome-extensions-utils/FeatureManager.js';


const SETTING_ISLANDS = "islands";
const SETTING_PANEL_GAP = "panel-gap";
const SETTING_WINDOW_GAP = "window-gap";
const SETTING_SQUARE_CORNERS = "square-corners";
const SETTING_HIDE_BUTTON = "hide-button";
const SETTING_EASY_DOCK = "easy-dock";

export default class PanelPillExtension extends Extension {
    #featureManager = null;
    WINDOW_GAP = 2;
    PANEL_GAP = 20;
    OVERVIEW_CORNER_DELAY = 300;

    panelPlacementLock = false;

    getSettings = super.getSettings;

    enable() {
        globalThis.global._panelpill = this;
        this.islandFeature = this.getIslandFeature();
        this.islandFeature.enable()
    }

    disable() {
        this.featureManager.disableAll();
        this.#featureManager = undefined;
        delete globalThis.global._panelpill;
    }


    /** @returns {FeatureManager} */
    get featureManager() {
        return this.#featureManager ??= new FeatureManager();
    }

    windowGap() {
        return this.getSettings().get_boolean(SETTING_WINDOW_GAP) ? this.WINDOW_GAP : 0;
    }

    panelGap() {
        return this.getSettings().get_boolean(SETTING_PANEL_GAP) ? this.PANEL_GAP : 0;
    }

    setIslandsStyle() {
        Main.panel.get_children().map(c => c.style = "background-color: rgba(100,100,100,100); border-radius:999px;")
    }
    resetIslandsStyle() {
        Main.panel.get_children().map(c => c.style = null)
    }


    setPanelPlacement() {
        Main.layoutManager.panelBox.y = globalThis.global.screen_height - this.windowGap();
        Main.layoutManager.panelBox.x = this.panelGap();
        Main.layoutManager.panelBox.width = globalThis.global.screen_width - this.panelGap() - this.panelGap();
        Main.panel.translation_y = this.panelGap() - Main.layoutManager.panelBox.y;
    }
    resetPanelPlacement() {
        Main.layoutManager.panelBox.y = 0;
        Main.layoutManager.panelBox.x = 0;
        Main.layoutManager.panelBox.width = globalThis.global.screen_width;
        Main.panel.translation_y = 0;
    }

    setPanelReactivity() {
        Main.panel.reactive = false;
    }
    resetPanelReactivity() {
        Main.panel.reactive = true;
    }

    setPanelStyle() {
        Main.panel.opacity = 222;
        Main.panel.style = "background-color: transparent;";
    }
    resetPanelStyle() {
        Main.panel.opacity = 255;
        Main.panel.style = null;
    }


    getIslandFeature() {
        return this.featureManager.newWithTimeouts(setTimeout => {
            const setPanel = () => {
                this.setIslandsStyle();
                this.setPanelPlacement();
                this.setPanelReactivity();
                this.setPanelStyle();
            };
            const resetPanel = () => {
                this.resetIslandsStyle();
                this.resetPanelPlacement();
                this.resetPanelReactivity();
                this.resetPanelStyle();
            };
            const againSetPanel = () => {
                if (this.panelPlacementLock) return;
                this.panelPlacementLock = true;
                Main.notify("this.setPanelPlacement()");
                this.setPanelPlacement();
                this.panelPlacementLock = false;
            };

            const delayedPlacement = () => {
                setTimeout(() => this.setPanelPlacement(), 300);
            }

            const onPanelResize = {
                connectable: Main.panel,
                event: "notify",
                callback: againSetPanel
            };
            const onOverviewHide = {
                connectable: Main.overview,
                event: "hiding",
                callback: delayedPlacement
            };

            return { onEnable: setPanel, onDisable: resetPanel, eventListeners: [onPanelResize, onOverviewHide] };
        });
    }
}
