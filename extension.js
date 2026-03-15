import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import Clutter from "gi://Clutter";
import Gio from 'gi://Gio';

// import Shell from "gi://Shell";
import St from "gi://St";

const DURATION_ASIDE = 7000;
const DURATION_ASIDE_VERYLONG = 1000000;
const DURATION_FADEIN = 2000;
const DURATION_FLICK = 200;
const DURATION_RETURN = 2000;
const MAXIMIZED_V_H = 3;
const PANEL_OPACITY_HIGH = 223;
const OPACITY_MAX = 255;
const PANEL_OPACITY_LOW = 100;
const PANEL_RATIO = 20;
const PANEL_GAP = 18;
const PANEL_HEIGHT = 40;
const ROUND_CORNERS_DELAY = 300;
const SCROLL_DIRECTION_DOWN = 0;
const SCROLL_DIRECTION_LEFT = 3;
const SCROLL_DIRECTION_RIGHT = 2;
const SCROLL_DIRECTION_UP = 1;
const STILL_ON_SCREEN_PIXEL = 4;
const TIEMOUT_HIDDEN = 10000;
const TIMEOUT_STRETCH_AFTER_MAXIMIZE = 400;
const WINDOW_GAP = 2;
const ANIMATION_NONE = -1;
const ANIMATION_LEFT = 0;
const ANIMATION_LEFTLEFT = 1;
const ANIMATION_RIGHT = 2;
const ANIMATION_RIGHTRIGHT = 3;
const ANIMATION_DOWN = 4;
const ANIMATION_UP = 5;

const SETTING_ISLANDS = "islands";
const SETTING_PANEL_GAP = "panel-gap";
const SETTING_WINDOW_GAP = "window-gap";
const SETTING_SQUARE_CORNERS = "square-corners";
const SETTING_HIDE_BUTTON = "hide-button";
const SETTING_EASY_DOCK = "easy-dock";

const set_panel_reactivity = (value) => {
    Main.panel.get_children().map(e => {
        e.get_children().map(f => { f.first_child.reactive = value; });
    });
}
const get_panel_width = () => {
    // this code would work, if the panel didnt resize (with accessibility and keyboard indicator)
    //        const elem_width = Main.panel.get_children().map(child => child.width).reduce((a, b) => a + b);
    //        const min_width = elem_width + (Main.panel.height * 8);
    // until there is a nicer fix this will do:
    const min_width = Main.panel.height * PANEL_RATIO;
    const new_width = Math.min(min_width, global.screen_width);
    return new_width;
}

export default class PanelPillExtension extends Extension {
    #mainOverviewListenerID1 = null;
    #mainOverviewListenerID2 = null;
    #mainPanelClickListenerID1 = null;
    #windowManagerResizeListenerID1 = null;
    #mainPanelScrollListenerID1 = null;
    #settingsListenerID = null;
    #hoverListenerElemsAndIDs = [];
    #appButtonClickListernerElemAndID = [];
    #hoverDockListenerAndID = [];

    #startupListenerID = null;

    #timeoutVanishID = null;
    #timeoutFadeinID = null;
    #timeoutFadeInStartEffectID = null;
    #timeoutRoundnessID = null;
    #timeoutStretchID = null;

    #ongoingAnimation = ANIMATION_NONE;

    /**
     * @returns {Console} A logger supporting log(), warn(), error(), info(), debug(), assert(), trace(), group(), groupEnd()
     */
    get logger() {
        return this.getLogger();
    }


    enable1() {
        global._panelpill = this;


        // this.enableUndoMaximizeBehaviour(); // not in use
        this.enableScrollBehaviour();
        this.enableOverviewClosingBehaviour();
        this.enableSettingsListener();
        this.enablePanelHoverColorListeners();
        this.enableOverviewShowingBehaviour();
        // this.resizeToPill(); // part of this.onSettingChanged();
        // this.enableClickToHideBehaviour(); // part of this.onSettingChanged();
        // this.enableDockHoverListener(); // part of this.onSettingChanged();
        // this.dockify(); // part of this.onSettingChanged();
        this.onSettingChanged();
    }

    disable1() {
        this.disableClickToHideBehaviour();
        this.disableUndoMaximizeBehaviour();
        this.disableScrollBehaviour();
        this.disableOverviewClosingBehaviour();
        this.disableOverviewShowingBehaviour();
        this.disableSettingsListener();
        this.disablePanelHoverColorListeners();
        this.disableDockHoverListener();
        this.disableShowAppButton();
        this.undockify();
        this.resizeBackToVanilla();

        Main.panel.opacity = OPACITY_MAX;
    }

    enable() {
        if (Main.layoutManager._startingUp === false) {
            this.enable1();
        } else {
            if (this.#startupListenerID) {
                Main.layoutManager.disconnect(this.#startupListenerID);
            }
            this.#startupListenerID = Main.layoutManager.connect('startup-complete', () => this.enable1());
        }
    }

    disable() {
        if (this.#startupListenerID) {
            Main.layoutManager.disconnect(this.#startupListenerID);
        }
        this.#startupListenerID = null;
        this.disable1();
    }


    get settings() {
        return this.getSettings();
    }

    get panelPlaceholderHeight() {
        return this.isSettingTrue(SETTING_WINDOW_GAP) ?
            WINDOW_GAP
            : 0;
    }

    get panelTopMargin() {
        return this.isSettingTrue(SETTING_PANEL_GAP) ?
            PANEL_GAP
            : 0;
    }

    get panelSidewaysMargin() {
        return PANEL_GAP;
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


    isSettingTrue(settingID) {
        return this.settings.get_boolean(settingID);
    }

    resizeToPill() {
        const margin = this.panelTopMargin + Main.panel.height + this.panelTopMargin;
        Main.overview._overview.first_child.first_child.style = "margin-top:" + margin + "px;"


        const new_width = this.isSettingTrue(SETTING_ISLANDS) ? global.screen_width - 2 * this.panelTopMargin : get_panel_width();
        const new_x = (global.screen_width - new_width) / 2;
        Main.panel.translation_y = this.panelTopMargin - global.screen_height + this.panelPlaceholderHeight;
        Main.layoutManager.panelBox.x = new_x;
        Main.layoutManager.panelBox.width = new_width;
        Main.panel.height = PANEL_HEIGHT;
        Main.panel.reactive = !this.isSettingTrue(SETTING_ISLANDS);

        const style_square = this.isSettingTrue(SETTING_SQUARE_CORNERS) ? "" : "border-radius: " + Main.panel.height + "px;";
        Main.panel.get_children().map(c => c.set_style("background-color: black;" + style_square));

        // the panelBox works as a placeholder for maximized windows. height = 0 makes windows maximized until the brim
        // with height = 0 the panel itself stays on the normal height.
        Main.layoutManager.panelBox.y = global.screen_height - this.panelPlaceholderHeight;
        Main.panel.opacity = PANEL_OPACITY_HIGH;
        this.setPanelStyle();
    }

    resizeBackToVanilla() {
        Main.overview._overview.first_child.first_child.style = null;

        Main.layoutManager.panelBox.y = 0;
        Main.layoutManager.panelBox.x = 0;
        Main.layoutManager.panelBox.width = global.screen_width;
        Main.layoutManager.panelBox.height = Main.panel.height;
        Main.panel.translation_y = 0;
        Main.panel.set_style(null);
        Main.panel.get_children().map(c => c.set_style(null));
    }

    setPanelStyle() {
        const style_islands = this.isSettingTrue(SETTING_ISLANDS) ? "background-color: transparent;" : "";
        const style_square = this.isSettingTrue(SETTING_SQUARE_CORNERS) ? "" : "border-radius: " + Main.panel.height + "px;";

        Main.panel.set_style(style_islands + style_square);
    }

    temporarySetReactivityFalse(duration) {
        set_panel_reactivity(false);
        Main.panel.opacity = 0;
        if (this.#timeoutFadeinID != null)
            clearTimeout(this.#timeoutFadeinID);
        if (this.#timeoutFadeInStartEffectID)
            clearTimeout(this.#timeoutFadeInStartEffectID);
        this.#timeoutFadeinID = setTimeout(this.resetReacticity.bind(this), duration);
        this.#timeoutFadeInStartEffectID = setTimeout(this.fadeInEffect.bind(this), duration - DURATION_FADEIN);
    }

    fadeInEffect() {
        Main.panel.ease({ opacity: PANEL_OPACITY_LOW, duration: DURATION_FADEIN, mode: Clutter.AnimationMode.EASE_IN_QUAD });
        Main.panel.first_child.first_child.first_child.remove_style_pseudo_class("hover");
    }

    resetReacticity() {
        if (this.#timeoutFadeinID)
            clearTimeout(this.#timeoutFadeinID);
        if (this.#timeoutFadeInStartEffectID)
            clearTimeout(this.#timeoutFadeInStartEffectID);
        this.#timeoutFadeinID = null;
        this.#timeoutFadeInStartEffectID = null;
        set_panel_reactivity(true);
        Main.panel.opacity = PANEL_OPACITY_HIGH;
    }

    dockify() {
        const box = new St.BoxLayout({
            name: "UNIQUE_DASH_WRAPPER_NAME"
        });
        box.height = global.screen_height;
        box.width = global.screen_width;
        const originalWrapper = Main.overview.dash.get_parent();
        originalWrapper.set_name("UNIQUE_DASH_WRAPPER_NAME2");
        originalWrapper.remove_child(Main.overview.dash);
        Main.uiGroup.add_child(box);
        box.add_child(Main.overview.dash);
        Main.overview.dash.x_align = Clutter.ActorAlign.CENTER;
        Main.overview.dash.x_expand = true;
        Main.overview.dash.y_align = Clutter.ActorAlign.END;
        Main.overview.dash.first_child.set_style(`background-color: ${this.darkAccentColor};`);
        Main.overview.dash.first_child.set_opacity(PANEL_OPACITY_LOW);
    }

    undockify() {
        Main.overview.dash.get_parent().remove_child(Main.overview.dash);
        Main.overview._overview.add_child(Main.overview.dash);
        Main.overview.dash.set_style(null);
        Main.overview.dash.first_child.set_style(null);
        Main.overview.dash.first_child.set_opacity(OPACITY_MAX);
    }

    hideDock() {
        Main.overview.dash.ease({
            translation_y: 100,
            duration: DURATION_FLICK,
            mode: Clutter.AnimationMode.EASE_IN_SINE
        });
    }

    showDock() {
        Main.overview.dash.ease({
            translation_y: 0,
            duration: DURATION_FLICK,
            mode: Clutter.AnimationMode.EASE_OUT_SINE
        });
    }

    showDockNow() {
        Main.overview.dash.translation_y = 0;
    }

    // EVENT TRIGGERED LOGIC

    enableDockHoverListener() {
        Main.overview.dash.set_reactive(true);
        this.#hoverDockListenerAndID.push([
            Main.overview.dash,
            Main.overview.dash.connect("enter-event", () => {
                this.showDock();
                if (Main.overview.visible) return;
                const styleLine = "box-shadow:0 0 16px 2px " + this.darkAccentColor + "; border-radius:99;";
                Main.overview.dash.first_child.set_opacity(PANEL_OPACITY_HIGH);
                Main.overview.dash.set_style(styleLine);
            })
        ]);
        this.#hoverDockListenerAndID.push([
            Main.overview.dash,
            Main.overview.dash.connect("leave-event", () => {
                Main.overview.dash.set_style(null);
                Main.overview.dash.first_child.set_opacity(PANEL_OPACITY_LOW);
                if (!Main.overview.visible) {
                    this.hideDock();
                }
            })
        ]);
    }


    enableDockHoverListener2broken() {
        Main.overview.dash.last_child.first_child.get_children().map(c1 => c1.first_child).map(c2 => {
            if (!c2?.connect) return;
            this.#hoverDockListenerAndID.push([
                c2,
                c2.connect("enter-event", () => {
                    c2.first_child.first_child.style = "box-shadow: 0 0 2px 1px darkblue; border-radius:99;";
                })
            ]);
            this.#hoverDockListenerAndID.push([
                c2,
                c2.connect("leave-event", () => {
                    c2.first_child.first_child.style = "";
                })
            ]);
        });
    }


    disableDockHoverListener() {
        this.#hoverDockListenerAndID.map(([elem, id]) => elem?.disconnect(id));
        this.#hoverDockListenerAndID = [];
    }

    enableShowAppButton() {
        this.#appButtonClickListernerElemAndID.map(([elem, id]) => elem?.disconnect(id));
        this.#appButtonClickListernerElemAndID = [];
        const elem = Main.overview.dash.last_child.last_child.first_child;
        const id = elem.connect('button-press-event', () => Main.overview.show());
        this.#appButtonClickListernerElemAndID.push([elem, id]);
    }

    disableShowAppButton() {
        this.#appButtonClickListernerElemAndID.map(([elem, id]) => elem?.disconnect(id));
        this.#appButtonClickListernerElemAndID = [];
    }

    enablePanelHoverColorListeners() {
        Main.panel.
            get_children().
            flatMap(c => c.get_children().map(c => c.first_child)).
            map(elem => {
                this.#hoverListenerElemsAndIDs.push([
                    elem,
                    elem.connect("enter-event", () => {
                        const styleLine = "box-shadow:0 0 16px 2px " + this.darkAccentColor + ";";
                        elem.style = (elem.style ?? "") + styleLine;
                    })
                ])
                this.#hoverListenerElemsAndIDs.push([
                    elem,
                    elem.connect("leave-event", () => {
                        elem.style = elem.style?.replace(/box-shadow:[^;]*;?/g, "");
                    })
                ])
            });
    }

    disablePanelHoverColorListeners() {
        this.#hoverListenerElemsAndIDs.map(([elem, id]) => elem?.set_style(null));
        this.#hoverListenerElemsAndIDs.map(([elem, id]) => elem?.disconnect(id));
        this.#hoverListenerElemsAndIDs = [];
    }

    disableSettingsListener() {
        if (this.#settingsListenerID !== null) {
            this.settings.disconnect(this.#settingsListenerID);
        }
        this.#settingsListenerID = null;
    }

    enableSettingsListener() {
        if (this.#settingsListenerID !== null) {
            this.settings.disconnect(this.#settingsListenerID);
        }
        this.#settingsListenerID = this.settings.connect("changed", this.onSettingChanged.bind(this));
    }

    onSettingChanged() {
        this.resizeToPill();
        if (this.isSettingTrue(SETTING_HIDE_BUTTON)) {
            this.enableClickToHideBehaviour();
        } else {
            this.disableClickToHideBehaviour();
        }
        if (this.isSettingTrue(SETTING_EASY_DOCK)) {
            this.dockify();
            this.enableDockHoverListener();
            this.enableShowAppButton();
        } else {
            this.disableDockHoverListener();
            this.disableShowAppButton();
            this.undockify();
        }
    }

    overviewShowingBehaviour() {
        if (this.isSettingTrue(SETTING_EASY_DOCK)) {
            this.showDock();
        }
    }
    enableOverviewShowingBehaviour() {
        if (this.#mainOverviewListenerID1 != null)
            Main.overview.disconnect(this.#mainOverviewListenerID1);
        this.#mainOverviewListenerID1 = Main.overview.connect('showing', this.overviewShowingBehaviour.bind(this));
    }

    disableOverviewShowingBehaviour() {
        if (this.#mainOverviewListenerID1 != null)
            Main.overview.disconnect(this.#mainOverviewListenerID1);
        this.#mainOverviewListenerID1 = null;
    }


    overviewClosingBehaviour() {
        // for some funny reason it only works with delay
        if (this.#timeoutRoundnessID != null)
            clearTimeout(this.#timeoutRoundnessID);
        this.#timeoutRoundnessID = setTimeout(this.setPanelStyle.bind(this), ROUND_CORNERS_DELAY);
        if (this.isSettingTrue(SETTING_EASY_DOCK)) {
            this.hideDock();
        }
    }

    enableOverviewClosingBehaviour() {
        if (this.#mainOverviewListenerID2 != null)
            Main.overview.disconnect(this.#mainOverviewListenerID2);
        this.#mainOverviewListenerID2 = Main.overview.connect('hiding', this.overviewClosingBehaviour.bind(this));
    }

    disableOverviewClosingBehaviour() {
        if (this.#mainOverviewListenerID2 != null)
            Main.overview.disconnect(this.#mainOverviewListenerID2);
        this.#mainOverviewListenerID2 = null;
        if (this.#timeoutRoundnessID != null)
            clearTimeout(this.#timeoutRoundnessID);
        this.#timeoutRoundnessID = null;
    }

    clickToHideBehaviour() {
        Main.panel.hide();
        // when hidden, there is no leave-event trigger
        Main.panel.first_child.first_child.first_child.style = "";

        if (this.#timeoutVanishID != null)
            clearTimeout(this.#timeoutVanishID);

        this.#timeoutVanishID = setTimeout(() => {
            Main.panel.show();
        }, TIEMOUT_HIDDEN);

        this.temporarySetReactivityFalse(TIEMOUT_HIDDEN + DURATION_FADEIN);

        return Clutter.EVENT_STOP; // Prevent further handling of the event
    }

    enableClickToHideBehaviour() {
        if (this.#mainPanelClickListenerID1 != null)
            Main.panel.first_child.first_child.first_child.disconnect(this.#mainPanelClickListenerID1);
        this.#mainPanelClickListenerID1 = Main.panel.first_child.first_child.first_child.connect('button-press-event', this.clickToHideBehaviour.bind(this));
    }

    disableClickToHideBehaviour() {
        this.resetReacticity();

        if (this.#mainPanelClickListenerID1 != null)
            Main.panel.first_child.first_child.first_child.disconnect(this.#mainPanelClickListenerID1);
        this.#mainPanelClickListenerID1 = null;

        if (this.#timeoutVanishID != null)
            clearTimeout(this.#timeoutVanishID);
        this.#timeoutVanishID = null;

        this.resetReacticity();
    }

    undoMaximizeBehaviour(wm, win) {
        if (win.metaWindow.get_maximized() == MAXIMIZED_V_H) {
            const unmaxWindow = () => win.metaWindow.unmaximize(MAXIMIZED_V_H);
            const stretchWindow = () => win.metaWindow.move_resize_frame(false, 0, 0, global.screen_width, global.screen_height);

            unmaxWindow();
            if (this.#timeoutStretchID)
                clearTimeout(this.#timeoutStretchID);
            this.#timeoutStretchID = setTimeout(stretchWindow, TIMEOUT_STRETCH_AFTER_MAXIMIZE);
        };
    };

    enableUndoMaximizeBehaviour() {
        if (this.#windowManagerResizeListenerID1 != null)
            global.window_manager.disconnect(this.#windowManagerResizeListenerID1);
        this.#windowManagerResizeListenerID1 = global.window_manager.connect_after('size-change', this.undoMaximizeBehaviour.bind(this));
    }

    disableUndoMaximizeBehaviour() {
        if (this.windowManagerListenerID1 != null)
            global.window_manager.disconnect(this.#windowManagerResizeListenerID1);
        this.#windowManagerResizeListenerID1 = null;

        if (this.#timeoutStretchID != null)
            clearTimeout(this.#timeoutStretchID);
        this.#timeoutStretchID = null;
    }



    flickSideways(direction, dur, strong) {
        // with Here is meant the target side / direction side
        if ((direction !== ANIMATION_RIGHT) && (direction !== ANIMATION_LEFT)) Main.panel.scaleY = 20;
        const isRight = direction === ANIMATION_RIGHT;

        const hasAnimation = this.#ongoingAnimation !== ANIMATION_NONE;
        const alreadyMovingSoft = this.#ongoingAnimation === direction;
        const requestEnforcingDirection = alreadyMovingSoft && strong;
        const invalidAnimationOverride = hasAnimation && !requestEnforcingDirection;

        const theVeryEnd = isRight ? (Main.layoutManager.panelBox.x - this.panelSidewaysMargin) : (this.panelSidewaysMargin - Main.layoutManager.panelBox.x);
        const panelIsAlreadyVeryHere = Main.layoutManager.panelBox.translation_x === theVeryEnd;

        if (invalidAnimationOverride || panelIsAlreadyVeryHere) return false;

        const panelIsHereOrMid = isRight ?
            (Main.layoutManager.panelBox.translation_x >= 0) :
            (Main.layoutManager.panelBox.translation_x <= 0);

        const relative_x = (strong || panelIsHereOrMid) ? theVeryEnd : 0;

        const thisAnimation =
            (relative_x === 0) ? direction :
                (isRight ? ANIMATION_RIGHTRIGHT : ANIMATION_LEFTLEFT);

        this.#ongoingAnimation = thisAnimation;

        Main.layoutManager.panelBox.ease({
            translation_x: relative_x,
            duration: dur,
            mode: Clutter.AnimationMode.EASE_IN_OUT_BACK,
            onComplete: _ => {
                if (this.#ongoingAnimation === thisAnimation)
                    this.#ongoingAnimation = ANIMATION_NONE;
            }
        });
        return true;
    }

    flickRight(dur, strong) {
        this.flickSideways(ANIMATION_RIGHT, dur, strong);
    }

    flickLeft(dur, strong) {
        this.flickSideways(ANIMATION_LEFT, dur, strong);
    }


    flickDown(dur, callb) {
        if (Main.layoutManager.panelBox.translation_y == 0) return false;
        Main.layoutManager.panelBox.ease({
            translation_y: 0,
            duration: dur,
            mode: Clutter.AnimationMode.EASE_IN_OUT_BACK,
            onComplete: _ => { callb() }
        });
        return true;
    }


    flickUp(dur, callb) {

        if (Main.layoutManager.panelBox.translation_y < 0) return false;
        const up_y = STILL_ON_SCREEN_PIXEL - Main.layoutManager.panelBox.y - Main.panel.translation_y - Main.panel.height;
        Main.layoutManager.panelBox.ease({
            translation_y: up_y,
            duration: dur,
            mode: Clutter.AnimationMode.EASE_IN_OUT_BACK,
            onComplete: _ => { callb() }
        });
        return true;
    }

    scrollBehaviour(_, event) {
        const direction = event.get_scroll_direction();
        const strongFlickLeft = event.get_scroll_delta()[0] > 2;
        const strongFlickRight = event.get_scroll_delta()[0] < (-2);

        switch (direction) {
            case SCROLL_DIRECTION_UP:
                this.flickUp(DURATION_FLICK, _ => {
                    const dur = DURATION_ASIDE_VERYLONG;
                    this.temporarySetReactivityFalse(dur + DURATION_RETURN + DURATION_FADEIN);
                    this.flickUp(dur, _ => {
                        this.flickDown(DURATION_RETURN);
                    });
                });
                break;
            case SCROLL_DIRECTION_DOWN:
                this.flickDown(DURATION_FLICK) &&
                    this.temporarySetReactivityFalse(DURATION_FLICK + DURATION_FADEIN);
                break;
            case SCROLL_DIRECTION_RIGHT:
                this.flickRight(DURATION_FLICK);
                break;
            case SCROLL_DIRECTION_LEFT:
                this.flickLeft(DURATION_FLICK);
                break;
            default:
                if (strongFlickLeft) {
                    this.flickLeft(DURATION_FLICK, true);
                } else if (strongFlickRight) {
                    this.flickRight(DURATION_FLICK, true);
                }
                break;
        }

    }

    enableScrollBehaviour() {
        if (this.#mainPanelScrollListenerID1 != null)
            Main.panel.disconnect(this.#mainPanelScrollListenerID1);
        this.#mainPanelScrollListenerID1 = Main.panel.connect('scroll-event', this.scrollBehaviour.bind(this))
    }

    disableScrollBehaviour() {
        if (this.#mainPanelScrollListenerID1 != null)
            Main.panel.disconnect(this.#mainPanelScrollListenerID1);
        this.#mainPanelScrollListenerID1 = null;
    }
}
