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

    #ORIGINAL_PANEL_HEIGHT = 32;
    #OPACITY_MAX = 255;

    OPACITY_HIGH = 222;

    OVERVIEW_CORNER_DELAY = 1;
    PANEL_GAP = 20;
    PANEL_HEIGHT = 40;
    WINDOW_GAP = 2;

    panelPlacementLock = 0;

    getSettings = super.getSettings;

    enable() {
        globalThis.global._panelpill = this;
        this.islandFeature = this.newIslandFeature();
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
        Main.panel.get_children().map(c => c.style = "background-color: black; border-radius:999px;")
    }
    resetIslandsStyle() {
        Main.panel.get_children().map(c => c.style = null)
    }


    setPanelPlacement() {
        Main.layoutManager.panelBox.y = globalThis.global.screen_height - this.windowGap();
        Main.layoutManager.panelBox.x = this.panelGap();
        Main.layoutManager.panelBox.width = globalThis.global.screen_width - this.panelGap() - this.panelGap();
        Main.panel.height = this.PANEL_HEIGHT;
        Main.panel.translation_y = this.panelGap() - Main.layoutManager.panelBox.y;
    }
    resetPanelPlacement() {
        this.panelPlacementLock++;
        Main.layoutManager.panelBox.y = 0;
        Main.layoutManager.panelBox.x = 0;
        Main.layoutManager.panelBox.width = globalThis.global.screen_width;
        Main.panel.height = this.#ORIGINAL_PANEL_HEIGHT;
        Main.panel.translation_y = 0;
        this.panelPlacementLock--;
    }

    setPanelReactivity() {
        Main.panel.reactive = false;
    }
    resetPanelReactivity() {
        Main.panel.reactive = true;
    }

    setPanelStyle() {
        Main.panel.opacity = this.#OPACITY_MAX;
        Main.panel.style = "background-color: transparent;";
    }
    resetPanelStyle() {
        Main.panel.opacity = this.#OPACITY_MAX;
        Main.panel.style = null;
    }

    setOverviewMargin() {
        const margin = this.panelGap() + Main.panel.height + this.panelGap();
        Main.overview._overview.first_child.first_child.style = `margin-top: ${margin}px;`
    }
    resetOverviewMargin() {
        Main.overview._overview.first_child.first_child.style = null;
    }

    newEasyDockFeature() {

    }

    newIslandFeature() {
        return this.featureManager.newWithTimeouts(setTimeout => {
            const setPanel = () => {
                this.setIslandsStyle();
                this.setPanelPlacement();
                this.setPanelReactivity();
                this.setPanelStyle();
                this.setOverviewMargin();
            };
            const resetPanel = () => {
                this.resetIslandsStyle();
                this.resetPanelPlacement();
                this.resetPanelReactivity();
                this.resetPanelStyle();
                this.resetOverviewMargin();
            };
            const againSetPanel = () => {
                if (this.panelPlacementLock > 0) return;
                this.panelPlacementLock++;
                // Main.notify("this.setPanelPlacement()");
                this.setPanelPlacement();
                this.panelPlacementLock--;
            };

            const onPanelResize = {
                connectable: Main.panel,
                event: "notify",
                callback: againSetPanel
            };
            const onOverviewHide = {
                connectable: Main.overview,
                event: "hiding",
                callback: () => setTimeout(() => this.setPanelStyle(), this.OVERVIEW_CORNER_DELAY)
            };

            return { onEnable: setPanel, onDisable: resetPanel, eventListeners: [onPanelResize, onOverviewHide] };
        });
    }
}
