/* @ts-ignore */
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
/* @ts-ignore */
import * as Main from "resource:///org/gnome/shell/ui/main.js";
/* @ts-ignore */
import Clutter from "gi://Clutter";
/* @ts-ignore */
import St from "gi://St";
/* @ts-ignore */
import Gio from 'gi://Gio';
import FeatureManager from './gnome-extensions-utils/FeatureManager.js';

const SETTING_ISLANDS = "islands";
const SETTING_PANEL_GAP = "panel-gap";
const SETTING_WINDOW_GAP = "window-gap";
const SETTING_SQUARE_CORNERS = "square-corners";
const SETTING_HIDE_BUTTON = "hide-button";
const SETTING_EASY_DOCK = "easy-dock";

const OPACITY_MAX = 255;
const OPACITY_HIGH = 222;
const DURATION_DOCK_EASEIN = 200;

export default class PanelPillExtension extends Extension {
    #featureManager = null;

    enable() {
        globalThis.global._panelpill = this;
        this.island = new Islands(this.featureManager, () => super.getSettings());
        this.islandFeature = this.island.newIslandFeature();
        this.islandFeature.enable();
        this.easyDock = new EasyDock(this.featureManager, () => super.getSettings());
        this.easyDockFeature = this.easyDock.newEasyDockFeature();
        this.easyDockFeature.enable();
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

}

class Islands {
    panelPlacementLock = 0;
    OVERVIEW_CORNER_DELAY = 1;
    WINDOW_GAP = 2;
    PANEL_GAP = 20;
    PANEL_HEIGHT = 40;
    #ORIGINAL_PANEL_HEIGHT = 32;

    featureManager;
    getSettings;
    constructor(/** @type {FeatureManager} */ fm, getSettings) {
        this.featureManager = fm;
        this.getSettings = getSettings;
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
        Main.panel.opacity = OPACITY_MAX;
        Main.panel.style = "background-color: transparent;";
    }
    resetPanelStyle() {
        Main.panel.opacity = OPACITY_MAX;
        Main.panel.style = null;
    }

    setOverviewMargin() {
        const margin = this.panelGap() + Main.panel.height + this.panelGap();
        Main.overview._overview.first_child.first_child.style = `margin-top: ${margin}px;`
    }
    resetOverviewMargin() {
        Main.overview._overview.first_child.first_child.style = null;
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

class EasyDock {
    DURATION_DOCK_EASEIN = 200;
    OPACITY_GLASSY = 100;

    featureManager;
    getSettings;
    constructor(/** @type {FeatureManager} */ fm, getSettings) {
        this.featureManager = fm;
        this.getSettings = getSettings;
    }

    get darkAccentColor() {
        const interfaceSettings = new Gio.Settings({ schema: 'org.gnome.desktop.interface' });
        const gnomeColor = interfaceSettings.get_string('accent-color');

        const colorMap = {
            blue: 'DarkBlue',
            teal: 'DarkCyan',
            green: 'DarkGreen',
            yellow: 'DarkGoldenRod',
            orange: 'DarkOrange',
            red: 'DarkRed',
            pink: 'DeepPink',
            purple: 'DarkMagenta',
            slate: 'DarkSlateGray'
        };

        return colorMap[gnomeColor] || colorMap.slate;
    }


    setDashStyle() {
        const shadowStyle = `box-shadow:0 0 ${Main.overview.dash.height / 4}px -${Main.overview.dash.height / 32}px ${this.darkAccentColor};`;
        const radiusStyle = `border-radius: ${Main.overview.dash.height / 4}px;`;
        Main.overview.dash.set_style(shadowStyle + radiusStyle);
        // Main.overview.dash.first_child.set_style(`background-color: ${this.darkAccentColor};`);
        Main.overview.dash.first_child.set_opacity(this.OPACITY_GLASSY);
    }
    resetDashStyle() {
        Main.overview.dash.set_style(null);
        Main.overview.dash.first_child.set_style(null);
        Main.overview.dash.first_child.set_opacity(OPACITY_MAX);
    }


    dockify() {
        const box = new St.BoxLayout();
        box.height = globalThis.global.screen_height;
        box.width = globalThis.global.screen_width;
        Main.overview.dash.get_parent().remove_child(Main.overview.dash);
        Main.uiGroup.add_child(box);
        box.add_child(Main.overview.dash);
        Main.overview.dash.x_expand = true;
        Main.overview.dash.x_align = Clutter.ActorAlign.CENTER;
        Main.overview.dash.y_align = Clutter.ActorAlign.END;
        this.setDashStyle();
    }

    undockify() {
        Main.overview.dash.get_parent().remove_child(Main.overview.dash);
        Main.overview._overview.first_child.add_child(Main.overview.dash);
        this.showDockNow();
        this.resetDashStyle();
    }


    hideDock() {
        Main.overview.dash.ease({
            opacity: this.OPACITY_GLASSY,
            translation_y: 100,
            duration: this.DURATION_DOCK_EASEIN,
            mode: Clutter.AnimationMode.EASE_IN_SINE
        });
    }

    showDock() {
        Main.panel.visible = true;
        Main.overview.dash.ease({
            opacity: OPACITY_MAX,
            translation_y: 0,
            duration: this.DURATION_DOCK_EASEIN,
            mode: Clutter.AnimationMode.EASE_OUT_SINE
        });
    }

    showDockNow() {
        Main.overview.dash.translation_y = 0;
    }



    newEasyDockFeature() {

        const onEnable = () => {
            this.dockify();
            Main.overview.dash.set_reactive(true);
        }
        const onDisable = () => {
            this.undockify();
            // this.resetDashStyle();
            // this.showDockNow();
        }
        const onOverviewHide = () => {
            this.hideDock();
            this.setDashStyle();
        }
        const onOverviewShow = () => {
            this.showDock();
            this.resetDashStyle();
        }

        const overviewShowListener = {
            connectable: Main.overview,
            event: "showing",
            callback: onOverviewShow
        };
        const overviewHideListener = {
            connectable: Main.overview,
            event: "hiding",
            callback: onOverviewHide
        };

        const hoverDockEnterListener = {
            connectable: Main.overview.dash,
            event: "enter-event",
            callback: () => this.showDock()
        }

        const hoverDockLeaveListener = {
            connectable: Main.overview.dash,
            event: "leave-event",
            callback: () => {
                if (!Main.overview.visible) {
                    this.hideDock();
                }
            }
        }

        const appButton = Main.overview.dash.last_child.last_child.first_child;
        const appButtonClickListener = {
            connectable: appButton,
            event: "button-press-event",
            callback: () => Main.overview.show()
        }


        return this.featureManager.new({ onEnable, onDisable, eventListeners: [overviewShowListener, overviewHideListener, hoverDockEnterListener, hoverDockLeaveListener, appButtonClickListener] });
    }


}