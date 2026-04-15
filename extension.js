// @ts-ignore
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
// @ts-ignore
import * as Main from "resource:///org/gnome/shell/ui/main.js";
// @ts-ignore
import Clutter from "gi://Clutter";
// @ts-ignore
import Gio from 'gi://Gio';

// import Shell from "gi://Shell";
// @ts-ignore
import St from "gi://St";



const ANIMATION_NONE = -1;
const ANIMATION_LEFT = 0;
const ANIMATION_LEFTLEFT = 1;
const ANIMATION_RIGHT = 2;
const ANIMATION_RIGHTRIGHT = 3;
const ANIMATION_DOWN = 4;
const ANIMATION_UP = 5;

const OPACITY_MAX = 255;


const SETTING_ISLANDS = "islands";
const SETTING_PANEL_GAP = "panel-gap";
const SETTING_WINDOW_GAP = "window-gap";
const SETTING_SQUARE_CORNERS = "square-corners";
const SETTING_HIDE_BUTTON = "hide-button";
const SETTING_EASY_DOCK = "easy-dock";


export default class PanelPillExtension extends Extension {
    DEFAULT_PANEL_OPACITY = 0.7;
    DURATION_ASIDE = 7000;
    DURATION_ASIDE_VERYLONG = 1000000;
    DURATION_FADEIN = 2000;
    DURATION_FLICK = 200;
    DURATION_RETURN = 2000;
    MAXIMIZED_V_H = 3;
    PANEL_OPACITY_HIGH = 223;
    PANEL_OPACITY_LOW = 100;
    PANEL_GAP = 18;
    PANEL_HEIGHT = 40;
    PANEL_XY_RATIO = 20;
    SCROLL_DIRECTION_DOWN = 0;
    SCROLL_DIRECTION_LEFT = 3;
    SCROLL_DIRECTION_RIGHT = 2;
    SCROLL_DIRECTION_UP = 1;
    STILL_ON_SCREEN_PIXEL = 4;
    TIEMOUT_HIDDEN = 10000;
    WINDOW_GAP = 2;

    #mainOverviewListenerID1 = null;
    #mainOverviewListenerID2 = null;
    #mainPanelClickListenerID1 = null;
    #mainPanelScrollListenerID1 = null;
    #settingsListenerID = null;
    #hoverListenerElemsAndIDs = [];
    #appButtonClickListernerElemAndID = [];
    #hoverDockListenerAndID = [];

    #startupListenerID = null;

    /** @type {number | null} */
    #timeoutVanishID = null;
    /** @type {number | null} */
    #timeoutFadeinID = null;
    /** @type {number | null} */
    #timeoutFadeInStartEffectID = null;
    /** @type {number | null} */
    #timeoutRoundnessID = null;

    #ongoingAnimation = ANIMATION_NONE;

    #settings = null; // protect it from the gc, so the .connect stays alive



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
        this.#settings = null;
    }

    enable() {
        if (Main.layoutManager._startingUp === false) {
            this.enable1();
        } else {
            if (this.#startupListenerID) {
                Main.layoutManager.disconnect(this.#startupListenerID);
            }
            this.#startupListenerID = Main.layoutManager.connect('startup-complete', () => {
                Main.layoutManager.disconnect(this.#startupListenerID);
                this.#startupListenerID = null;
                this.enable1();
            });
        }

    }

    disable() {
        if (this.#startupListenerID) {
            Main.layoutManager.disconnect(this.#startupListenerID);
        }
        this.#startupListenerID = null;
        this.disable1();
    }


    /** @returns {any} */
    get settings() {
        if (this.#settings === null) {
            // @ts-ignore
            this.#settings = this.getSettings();
        }
        return this.#settings;
    }

    get panelPlaceholderHeight() {
        return this.isSettingTrue(SETTING_WINDOW_GAP) ?
            this.WINDOW_GAP
            : 0;
    }

    get panelTopMargin() {
        return this.isSettingTrue(SETTING_PANEL_GAP) ?
            this.PANEL_GAP
            : 0;
    }

    get panelSidewaysMargin() {
        return this.PANEL_GAP;
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

    getPanelWidth = () => {
        // this code would work, if the panel didnt resize (with accessibility and keyboard indicator)
        //        const elem_width = Main.panel.get_children().map(child => child.width).reduce((a, b) => a + b);
        //        const min_width = elem_width + (Main.panel.height * 8);
        // until there is a nicer fix this will do:
        const min_width = Main.panel.height * this.PANEL_XY_RATIO;
        const new_width = Math.min(min_width, global.screen_width);
        return new_width;
    }

    setPanelReactivity = (value) => {
        Main.panel.get_children().map(e => {
            e.get_children().map(f => { f.first_child.reactive = value; });
        });
    }


    isSettingTrue(settingID) {
        return this.settings.get_boolean(settingID);
    }

    resetPanelChildStyles() {
        Main.panel.get_children().map(c1 => {
            c1.set_style(null);
            c1.map(c2 => c2.first_child.set_style(null));
        });
    }

    setPanelSingleChildStyle(c, activeShadow = false) {
        const style_square = this.isSettingTrue(SETTING_SQUARE_CORNERS) ? "" : `border-radius: ${Main.panel.height}px;`;
        const h = Main.panel.height;
        const shadowStyle = `box-shadow: 0 -${h / 20}px ${h * (activeShadow ? 1 : 2) / 5}px ${h * (activeShadow ? 1 : -1) / 5.7}px ${this.darkAccentColor};`;

        c.set_style(`${style_square} background-color: rgba(40,40,40,${this.DEFAULT_PANEL_OPACITY}); ${shadowStyle}`);

    }

    setPanelChildStyles() {
        Main.panel.get_children().map(c => {
            this.setPanelSingleChildStyle(c);
        });
    }

    resizeToPill() {
        const margin = this.panelTopMargin + Main.panel.height + this.panelTopMargin;
        Main.overview._overview.first_child.first_child.style = `margin-top: ${margin}px;`


        const new_width = this.isSettingTrue(SETTING_ISLANDS) ? global.screen_width - 2 * this.panelTopMargin : this.getPanelWidth();
        const new_x = (global.screen_width - new_width) / 2;
        Main.panel.translation_y = this.panelTopMargin - global.screen_height + this.panelPlaceholderHeight;
        Main.layoutManager.panelBox.x = new_x;
        Main.layoutManager.panelBox.width = new_width;
        Main.panel.height = this.PANEL_HEIGHT;
        Main.panel.reactive = !this.isSettingTrue(SETTING_ISLANDS);

        this.setPanelChildStyles();


        // the panelBox works as a placeholder for maximized windows. height = 0 makes windows maximized until the brim
        // with height = 0 the panel itself stays on the normal height.
        Main.layoutManager.panelBox.y = global.screen_height - this.panelPlaceholderHeight;
        Main.panel.opacity = this.PANEL_OPACITY_HIGH;
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
        this.resetPanelChildStyles();
    }

    setPanelStyle() {
        const style_islands = this.isSettingTrue(SETTING_ISLANDS) ? "background-color: transparent;" : "";
        const style_square = this.isSettingTrue(SETTING_SQUARE_CORNERS) ? "" : `border-radius: ${Main.panel.height}px;`;

        Main.panel.set_style(style_islands + style_square);
    }

    temporarySetReactivityFalse(duration) {
        this.setPanelReactivity(false);
        Main.panel.opacity = 0;
        if (this.#timeoutFadeinID != null)
            clearTimeout(this.#timeoutFadeinID);
        if (this.#timeoutFadeInStartEffectID)
            clearTimeout(this.#timeoutFadeInStartEffectID);
        this.#timeoutFadeinID = setTimeout(() => this.resetReactivity(), duration);
        this.#timeoutFadeInStartEffectID = setTimeout(() => this.fadeInEffect(), duration - this.DURATION_FADEIN);
    }

    fadeInEffect() {
        Main.panel.ease({ opacity: this.PANEL_OPACITY_LOW, duration: this.DURATION_FADEIN, mode: Clutter.AnimationMode.EASE_IN_QUAD });
        Main.panel.first_child.first_child.first_child.remove_style_pseudo_class("hover");
    }

    resetReactivity() {
        if (this.#timeoutFadeinID)
            clearTimeout(this.#timeoutFadeinID);
        if (this.#timeoutFadeInStartEffectID)
            clearTimeout(this.#timeoutFadeInStartEffectID);
        this.#timeoutFadeinID = null;
        this.#timeoutFadeInStartEffectID = null;
        this.setPanelReactivity(true);
        Main.panel.opacity = this.PANEL_OPACITY_HIGH;
    }

    dockify() {
        const box = new St.BoxLayout();
        box.height = global.screen_height;
        box.width = global.screen_width;
        Main.overview.dash.get_parent().remove_child(Main.overview.dash);
        Main.uiGroup.add_child(box);
        box.add_child(Main.overview.dash);
        Main.overview.dash.x_expand = true;
        Main.overview.dash.x_align = Clutter.ActorAlign.CENTER;
        Main.overview.dash.y_align = Clutter.ActorAlign.END;
        this.setColoredDashStyle();
    }

    undockify() {
        Main.overview.dash.get_parent().remove_child(Main.overview.dash);
        Main.overview._overview.first_child.add_child(Main.overview.dash);
        this.showDockNow();
        this.resetDashStyle();
    }

    hideDock() {
        Main.overview.dash.ease({
            translation_y: 100,
            duration: this.DURATION_FLICK,
            mode: Clutter.AnimationMode.EASE_IN_SINE
        });
    }

    showDock() {
        Main.panel.visible = true;
        Main.overview.dash.ease({
            opacity: OPACITY_MAX,
            translation_y: 0,
            duration: this.DURATION_FLICK,
            mode: Clutter.AnimationMode.EASE_OUT_SINE
        });
    }

    showDockNow() {
        Main.overview.dash.translation_y = 0;
    }

    resetDashStyle() {
        Main.overview.dash.set_style(null);
        Main.overview.dash.first_child.set_style(null);
    }

    setPassiveDashStyle() {
        const shadowStyle = `box-shadow:0 ${Main.overview.dash.height / 16}px ${Main.overview.dash.height / 2}px -${Main.overview.dash.height / 4}px ${this.darkAccentColor}; `;
        const radiusStyle = `border-radius: ${Main.overview.dash.height / 4}px; `;
        Main.overview.dash.set_style(shadowStyle + radiusStyle);
        Main.overview.dash.first_child.set_style(null);
    }

    setColoredDashStyle() {
        const shadowStyle = `box-shadow:0 ${Main.overview.dash.height / 16}px ${Main.overview.dash.height / 2}px -${Main.overview.dash.height / 8}px ${this.darkAccentColor}; `;
        const radiusStyle = `border-radius: ${Main.overview.dash.height / 4}px; `;
        Main.overview.dash.set_style(shadowStyle + radiusStyle);
        Main.overview.dash.first_child.set_style(`background-color: rgba(50,50,50,0.4); `);
    }

    // EVENT TRIGGERED LOGIC

    enableDockHoverListener() {
        Main.overview.dash.set_reactive(true);
        this.#hoverDockListenerAndID.push([
            Main.overview.dash,
            Main.overview.dash.connect("enter-event", () => {
                this.showDock();
            })
        ]);
        this.#hoverDockListenerAndID.push([
            Main.overview.dash,
            Main.overview.dash.connect("leave-event", () => {
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
        const id = elem.connect('button-press-event', () => {
            if (!Main.overview.visible) {
                Main.overview.showApps();
                return Clutter.EVENT_STOP;
            }
        });
        this.#appButtonClickListernerElemAndID.push([elem, id]);
    }

    disableShowAppButton() {
        this.#appButtonClickListernerElemAndID.map(([elem, id]) => elem?.disconnect(id));
        this.#appButtonClickListernerElemAndID = [];
    }

    enablePanelHoverColorListeners() {
        Main.panel.
            get_children().
            map(c1 => c1.get_children().map(c2 => {
                const reactiveElem = c2.first_child;
                this.#hoverListenerElemsAndIDs.push([
                    reactiveElem,
                    reactiveElem.connect("enter-event", () => {
                        reactiveElem.set_style(`box-shadow: 0 0 ${Main.panel.height / 2}px -${Main.panel.height / 8}px #666666;`);
                        this.setPanelSingleChildStyle(c1, true);
                    })
                ]);
                this.#hoverListenerElemsAndIDs.push([
                    reactiveElem,
                    reactiveElem.connect("leave-event", () => {
                        reactiveElem.set_style(null);
                        this.setPanelSingleChildStyle(c1);
                    })
                ]);

            }));
    }

    disablePanelHoverColorListeners() {
        this.#hoverListenerElemsAndIDs.map(([elem, _id]) => elem?.set_style(null));
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
        this.#settingsListenerID = this.settings.connect("changed", () => this.onSettingChanged());
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
            this.setPassiveDashStyle();
        }
    }
    enableOverviewShowingBehaviour() {
        if (this.#mainOverviewListenerID1 != null)
            Main.overview.disconnect(this.#mainOverviewListenerID1);
        this.#mainOverviewListenerID1 = Main.overview.connect('showing', () => this.overviewShowingBehaviour());
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
        // this.setPanelStyle();
        this.#timeoutRoundnessID = setTimeout(() => this.setPanelStyle(), 1);
        if (this.isSettingTrue(SETTING_EASY_DOCK)) {
            this.setColoredDashStyle();
            const [mouseX, mouseY] = global.get_pointer();

            const [dashX, dashY] = Main.overview.dash.get_transformed_position();
            const [dashW, dashH] = Main.overview.dash.get_transformed_size();

            const insideDash =
                mouseX >= dashX &&
                mouseX <= dashX + dashW &&
                mouseY >= dashY &&
                mouseY <= dashY + dashH;
            if (!insideDash)
                this.hideDock();
        }
    }

    enableOverviewClosingBehaviour() {
        if (this.#mainOverviewListenerID2 != null) Main.overview.disconnect(this.#mainOverviewListenerID2);
        this.#mainOverviewListenerID2 = Main.overview.connectAfter('hidden', () => this.overviewClosingBehaviour());
    }

    disableOverviewClosingBehaviour() {
        if (this.#mainOverviewListenerID2 != null) Main.overview.disconnect(this.#mainOverviewListenerID2);
        this.#mainOverviewListenerID2 = null;
        if (this.#timeoutRoundnessID != null) clearTimeout(this.#timeoutRoundnessID);
        this.#timeoutRoundnessID = null;
    }

    clickToHideBehaviour(_a, b) {

        if (Clutter.BUTTON_SECONDARY === b.get_button()) {

            Main.overview.dash.opacity = 0;
            Main.notify("Fullscreen modus", "To exit, move the mouse to the dock.");

        } else {

            if (this.#timeoutVanishID != null) clearTimeout(this.#timeoutVanishID);
            this.#timeoutVanishID = setTimeout(() => Main.panel.show(), this.TIEMOUT_HIDDEN);

            this.temporarySetReactivityFalse(this.TIEMOUT_HIDDEN + this.DURATION_FADEIN);

        }

        Main.panel.hide();
        Main.panel.first_child.first_child.first_child.style = ""; // when hidden, there is no leave-event trigger, so we remove the blur style manually

        return Clutter.EVENT_STOP; // Prevent further handling of the event
    }

    enableClickToHideBehaviour() {
        if (this.#mainPanelClickListenerID1 != null)
            Main.panel.first_child.first_child.first_child.disconnect(this.#mainPanelClickListenerID1);
        this.#mainPanelClickListenerID1 = Main.panel.first_child.first_child.first_child.connect('button-press-event', (a, b) => this.clickToHideBehaviour(a, b));
    }

    disableClickToHideBehaviour() {
        this.resetReactivity();

        if (this.#mainPanelClickListenerID1 != null)
            Main.panel.first_child.first_child.first_child.disconnect(this.#mainPanelClickListenerID1);
        this.#mainPanelClickListenerID1 = null;

        if (this.#timeoutVanishID != null)
            clearTimeout(this.#timeoutVanishID);
        this.#timeoutVanishID = null;

        this.resetReactivity();
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
        const up_y = this.STILL_ON_SCREEN_PIXEL - Main.layoutManager.panelBox.y - Main.panel.translation_y - Main.panel.height;
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
            case this.SCROLL_DIRECTION_UP:
                this.flickUp(this.DURATION_FLICK, _ => {
                    const dur = this.DURATION_ASIDE_VERYLONG;
                    this.temporarySetReactivityFalse(dur + this.DURATION_RETURN + this.DURATION_FADEIN);
                    this.flickUp(dur, _ => {
                        this.flickDown(this.DURATION_RETURN);
                    });
                });
                break;
            case this.SCROLL_DIRECTION_DOWN:
                this.flickDown(this.DURATION_FLICK) &&
                    this.temporarySetReactivityFalse(this.DURATION_FLICK + this.DURATION_FADEIN);
                break;
            case this.SCROLL_DIRECTION_RIGHT:
                this.flickRight(this.DURATION_FLICK);
                break;
            case this.SCROLL_DIRECTION_LEFT:
                this.flickLeft(this.DURATION_FLICK);
                break;
            default:
                if (strongFlickLeft) {
                    this.flickLeft(this.DURATION_FLICK, true);
                } else if (strongFlickRight) {
                    this.flickRight(this.DURATION_FLICK, true);
                }
                break;
        }

    }

    enableScrollBehaviour() {
        if (this.#mainPanelScrollListenerID1 != null)
            Main.panel.disconnect(this.#mainPanelScrollListenerID1);
        this.#mainPanelScrollListenerID1 = Main.panel.connect('scroll-event', () => this.scrollBehaviour())
    }

    disableScrollBehaviour() {
        if (this.#mainPanelScrollListenerID1 != null)
            Main.panel.disconnect(this.#mainPanelScrollListenerID1);
        this.#mainPanelScrollListenerID1 = null;
    }
}
