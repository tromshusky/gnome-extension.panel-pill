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
import FeatureManager, { Feature } from './gnome-extensions-utils/FeatureManager.js';

const SETTING_ISLANDS = "islands";
const SETTING_PANEL_GAP = "panel-gap";
const SETTING_WINDOW_GAP = "window-gap";
const SETTING_SQUARE_CORNERS = "square-corners";
const SETTING_HIDE_BUTTON = "hide-button";
const SETTING_EASY_DOCK = "easy-dock";

const OPACITY_MAX = 255;


export default class PanelPillExtension extends Extension {
    enable() {
        globalThis.global._panelpill = this;
        this.featureManager = getMyFeatureManager({
            PANEL_GAP: 20,
            WINDOW_GAP: 2,
            PANEL_HEIGHT: 40,
            ORIGINAL_PANEL_HEIGHT: 32,
            OVERVIEW_CORNER_DELAY: 1
        });
        //    this.featureManager.enableAll();
    }
    disable() {
        this.featureManager.disableAll();
    }


}


const getMyFeatureManager = (params) => {


    const panelPillFeatures = getPillFeatures(params);

    const featPanelpill = Feature({
        onEnable: ___ => fm.enableMore(...panelPillFeatures),
        onDisable: _ => fm.disableMore(...panelPillFeatures)
    })

    ///

    //TODO
    //FIXME
    // The reason i had a builder pattern, was to enforce the registration of all features before using them, so features can cross reference each other.
    // With the current implementation, it is not enforced.

    const fm = FeatureManager.
        empty().
        addFeature(panelPillFeatures[0]).
        addFeature(panelPillFeatures[1]).
        addFeature(panelPillFeatures[2]).
        addFeature(panelPillFeatures[3]).
        addFeature(panelPillFeatures[4]).
        addFeature(featPanelpill).
        build();
        
    fm.enable(featPanelpill);
    return fm;
}

const getPillFeatures = ({ PANEL_GAP, WINDOW_GAP, PANEL_HEIGHT, ORIGINAL_PANEL_HEIGHT, OVERVIEW_CORNER_DELAY }) => {
    const setPanelStyle = () => Main.panel.style = "background-color: transparent;";
    const resetPanelStyle = () => Main.panel.style = null;

    const featMainPanelStyle = Feature(({ setTimeout }) => ({
        onEnable: setPanelStyle,
        onDisable: resetPanelStyle,
        eventListeners: [
            {
                connectable: Main.overview,
                event: "hiding",
                callback: () => setTimeout(setPanelStyle, OVERVIEW_CORNER_DELAY)
            }
        ]
    }));

    ///

    let panelPlacementLock = 0;
    const setPanelPlacement = () => {
        if (panelPlacementLock > 0) return;
        panelPlacementLock++;
        Main.layoutManager.panelBox.y = globalThis.global.screen_height - WINDOW_GAP;
        Main.layoutManager.panelBox.x = PANEL_GAP;
        Main.layoutManager.panelBox.width = globalThis.global.screen_width - PANEL_GAP - PANEL_GAP;
        Main.panel.height = PANEL_HEIGHT;
        Main.panel.translation_y = PANEL_GAP - Main.layoutManager.panelBox.y;
        panelPlacementLock--;
    };
    const resetPanelPlacement = () => {
        if (panelPlacementLock > 0) return;
        panelPlacementLock++;
        Main.layoutManager.panelBox.y = 0;
        Main.layoutManager.panelBox.x = 0;
        Main.layoutManager.panelBox.width = globalThis.global.screen_width;
        Main.panel.height = ORIGINAL_PANEL_HEIGHT;
        Main.panel.translation_y = 0;
        panelPlacementLock--;
    };

    const featMainPanelPlacement = Feature({
        onEnable: setPanelPlacement,
        onDisable: resetPanelPlacement,
        eventListeners: [
            {
                connectable: Main.panel,
                event: "notify",
                callback: setPanelPlacement
            }
        ]
    });

    ///

    const featMainPanelReactivity = Feature({
        onEnable: () => Main.panel.reactive = false,
        onDisable: _ => Main.panel.reactive = true,
    })

    ///

    const featIslandPilled = Feature({
        onEnable: () => Main.panel.get_children().map(c => c.style = `background-color: black; border-radius:${Main.panel.height}px;`),
        onDisable: _ => Main.panel.get_children().map(c => c.style = null),
    });

    ///

    const featOverviewMargin = Feature({
        onEnable: () => {
            const margin = PANEL_GAP + Main.panel.height + PANEL_GAP;
            Main.overview._overview.first_child.first_child.style = `margin-top: ${margin}px;`
        },
        onDisable: () => Main.overview._overview.first_child.first_child.style = null
    });

    ///

    return [
        featIslandPilled,
        featMainPanelPlacement,
        featMainPanelReactivity,
        featMainPanelStyle,
        featOverviewMargin,
    ];

}

class Is {
    static #ORIGINAL_PANEL_HEIGHT = 32;
    static OVERVIEW_CORNER_DELAY = 1;
    static PANEL_GAP = 20;
    static PANEL_HEIGHT = 40;
    static panelPlacementLock = 0;
    static WINDOW_GAP = 2;

    static onEnable() {
        this.setPanelStyle();
        this.setPanelPlacement();
        this.setIslandsStyle();
        this.setOverviewMargin();
        this.setPanelReactivity();
    }

    static onDisable() {
        this.resetPanelStyle();
        this.resetPanelPlacement();
        this.resetIslandsStyle();
        this.resetOverviewMargin();
        this.resetPanelReactivity();
    }


    static getFeature(tools) {
        return {
            onEnable: () => this.onEnable(),
            onDisable: () => this.onDisable(),
            eventListeners: this.getEventListeners(tools)
        }
    }

    static getEventListeners(tools) {
        return [
            this.onPanelResize,
            this.getOnOverviewHide(tools)
        ]
    }

    static getOnOverviewHide({ setTimeout }) {
        return {
            connectable: Main.overview,
            event: "hiding",
            callback: () => setTimeout(() => this.setPanelStyle(), this.OVERVIEW_CORNER_DELAY)
        }
    }


    static onPanelResize = {
        connectable: Main.panel,
        event: "notify",
        callback: () => this.setPanelPlacement()
    };


    static setIslandsStyle() {
        Main.panel.get_children().map(c => c.style = `background-color: black; border-radius:${this.PANEL_HEIGHT}px;`);
    }
    static resetIslandsStyle() {
        Main.panel.get_children().map(c => c.style = null);
    }

    static setPanelStyle() {
        // Main.panel.opacity = OPACITY_MAX;
        Main.panel.style = "background-color: transparent;";
    }
    static resetPanelStyle() {
        // Main.panel.opacity = OPACITY_MAX;
        Main.panel.style = null;
    }

    static setPanelPlacement() {
        if (this.panelPlacementLock > 0) return;
        this.panelPlacementLock++;
        Main.layoutManager.panelBox.y = globalThis.global.screen_height - this.WINDOW_GAP;
        Main.layoutManager.panelBox.x = this.PANEL_GAP;
        Main.layoutManager.panelBox.width = globalThis.global.screen_width - this.PANEL_GAP - this.PANEL_GAP;
        Main.panel.height = this.PANEL_HEIGHT;
        Main.panel.translation_y = this.PANEL_GAP - Main.layoutManager.panelBox.y;
        this.panelPlacementLock--;

    }
    static resetPanelPlacement() {
        if (this.panelPlacementLock > 0) return;
        this.panelPlacementLock++;
        Main.layoutManager.panelBox.y = 0;
        Main.layoutManager.panelBox.x = 0;
        Main.layoutManager.panelBox.width = globalThis.global.screen_width;
        Main.panel.height = this.#ORIGINAL_PANEL_HEIGHT;
        Main.panel.translation_y = 0;
        this.panelPlacementLock--;
    }

    static setPanelReactivity() {
        Main.panel.reactive = false;
    }
    static resetPanelReactivity() {
        Main.panel.reactive = true;
    }

    static setOverviewMargin() {
        const margin = this.PANEL_GAP + Main.panel.height + this.PANEL_GAP;
        Main.overview._overview.first_child.first_child.style = `margin-top: ${margin}px;`
    }
    static resetOverviewMargin() {
        Main.overview._overview.first_child.first_child.style = null;
    }



}

class Ez {
    getFeature({ setTimeout }) {
        const onEnable = this.onEnable;
        const onDisable = this.onDisable;
        const eventListeners = this.eventListeners;
        return { onEnable, onDisable, eventListeners };
    }

    onEnable() {

    }
    onDisable() {

    }
    get eventListeners() {
        return [this.eventListener1];
    }
    get eventListener1() {
        const event = "hi";
        const connectable = undefined;
        const callback = () => { };
        return { connectable, event, callback };
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

    /**
     * @param {FeatureManager} fm
     * @param {() => any} getSettings
     * @param {(f: Function)=> any} callbackSettingsListener
     */
    constructor(fm, getSettings, callbackSettingsListener) {
        this.featureManager = fm;
        this.getSettings = getSettings;
        callbackSettingsListener(this.onSettingsChange.bind(this));
    }

    onSettingsChange(...args) {

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
    constructor(/** @type {FeatureManager} */ fm, getSettings, callbackSettingsListener) {
        this.featureManager = fm;
        this.getSettings = getSettings;
        callbackSettingsListener(this.onSettingsChange.bind(this));
    }

    onSettingsChange() {

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

    getOpacity() {
        return this.OPACITY_GLASSY;
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
        Main.overview.dash.opacity = OPACITY_MAX;
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

        const eventListeners = [overviewShowListener, overviewHideListener, hoverDockEnterListener, hoverDockLeaveListener, appButtonClickListener];

        return this.featureManager.new({ onEnable, onDisable, eventListeners });
    }


}