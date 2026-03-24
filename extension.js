import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import Clutter from "gi://Clutter";
import Gio from 'gi://Gio';

// import Shell from "gi://Shell";
import St from "gi://St";

const SETTING_ISLANDS = "islands";
const SETTING_PANEL_GAP = "panel-gap";
const SETTING_WINDOW_GAP = "window-gap";
const SETTING_SQUARE_CORNERS = "square-corners";
const SETTING_HIDE_BUTTON = "hide-button";
const SETTING_EASY_DOCK = "easy-dock";


class ManagedFeature {
    #featureManager;
    constructor(featureManager) {
        this.#featureManager = featureManager;
    }
    enable() {
        return this.#featureManager.enable(this);
    }
    disable() {
        return this.#featureManager.disable(this);
    }
}

/** @typedef RegisteredFeatureData @type {{onEnable: Function, onDisable: Function, eventListeners: Array<EventListenerData>}}  */
/** @typedef EventListenerData @type {{connectable: Connectable, event: String, callback: Function}} */
/** @typedef Connectable @type {{connect: ()=>number, disconnect:(id: number) => void}} */
/** @typedef ActiveEventListener @type {{id: number, connectable: Connectable}} */

class FeatureManager {
    /** @type {Map<ManagedFeature,RegisteredFeatureData>} */
    #features = new Map();
    /** @type {Map<ManagedFeature,Array<ActiveEventListener>>} */
    #activeEventListeners = new Map();

    new(onEnable, onDisable, eventListeners) {
        const newFeature = new ManagedFeature(this);
        this.#features.set(newFeature, { onEnable, onDisable, eventListeners });
        return newFeature;
    }

    enable(featureHandle) {
        this.#disconnect(featureHandle);
        const registeredFeature = this.#features.get(featureHandle);
        if (registeredFeature) {
            registeredFeature.onEnable();
            const newEventListeners = registeredFeature.eventListeners.map(elData => { return { id: elData.connectable.connect(elData.event, elData.callback), connectable: elData.connectable } });
            this.#activeEventListeners.set(featureHandle, newEventListeners);
        }
    }

    #disconnect(featureHandle) {
        const disconnectAnswer = this.#activeEventListeners.get(featureHandle)?.map(eventListener => eventListener.connectable.disconnect(eventListener.id));
        this.#activeEventListeners.set(featureHandle, null);
        return disconnectAnswer;
    }

    disable(featureHandle) {
        this.#disconnect(featureHandle);
        const registeredFeature = this.#features.get(featureHandle);
        if (registeredFeature) {
            registeredFeature.onDisable();
        }
    }

    disableAll() {
        return this.#features.forEach((registeredFeature, featureHandle) => this.disable(featureHandle));
    }
}

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

    get featureManager() {
        return this.#featureManager ??= new FeatureManager();
    }

    windowGap() {
        return this.settings().get_boolean(SETTING_WINDOW_GAP) ? this.WINDOW_GAP : 0;
    }

    panelGap() {
        return this.settings().get_boolean(SETTING_PANEL_GAP) ? this.PANEL_GAP : 0;
    }

    getIslandFeature() {
        const setPanelPlacement = () => {
            Main.layoutManager.panelBox.y = global.screen_height - this.windowGap();
            Main.layoutManager.panelBox.x = this.panelGap();
            Main.layoutManager.panelBox.width = global.screen_width - this.panelGap() - this.panelGap();
            Main.panel.translation_y = this.panelGap() - Main.layoutManager.panelBox.y;
        };


    }
}
