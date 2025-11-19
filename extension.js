import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import Clutter from "gi://Clutter";

// import Shell from "gi://Shell";
// import St from "gi://St";

const DURATION_ASIDE = 7000;
const DURATION_ASIDE_VERYLONG = 1000000;
const DURATION_FADEIN = 800;
const DURATION_FLICK = 200;
const DURATION_RETURN = 2000;
const MAXIMIZED_V_H = 3;
const PANEL_OPACITY_HIGH = 225;
const PANEL_OPACITY_MAX = 255;
const PANEL_OPACITY_LOW = 100;
const PANEL_RATIO = 20;
const PANEL_Y = 4;
const SCROLL_DIRECTION_DOWN = 0;
const SCROLL_DIRECTION_LEFT = 3;
const SCROLL_DIRECTION_RIGHT = 2;
const SCROLL_DIRECTION_UP = 1;
const STILL_ON_SCREEN_PIXEL = 4;
const TIEMOUT_HIDDEN = 7000;
const TIMEOUT_STRETCH_AFTER_MAXIMIZE = 400;
const ANIMATION_NONE = -1;
const ANIMATION_LEFT = 0;
const ANIMATION_LEFTLEFT = 1;
const ANIMATION_RIGHT = 2;
const ANIMATION_RIGHTRIGHT = 3;
const ANIMATION_DOWN = 4;
const ANIMATION_UP = 5;


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

    #timeoutVanishID = null;
    #timeoutFadeinID = null;
    #timeoutRoundnessID = null;
    #timeoutStretchID = null;

    #ongoingAnimation = ANIMATION_NONE;

    enable() {
        global._panelpill = {};
        // this.enableClickToHideBehaviour();
        // this.enableUndoMaximizeBehaviour();
        this.enableScrollBehaviour();
        this.enableOverviewOpeningBehaviour();
        this.enableOverviewClosingBehaviour();
        this.resizeToPill();

    }

    disable() {
        this.disableClickToHideBehaviour();
        this.disableUndoMaximizeBehaviour();
        this.disableScrollBehaviour();
        this.disableOverviewOpeningBehaviour();
        this.disableOverviewClosingBehaviour();
        this.resizeBackToVanilla();
        Main.panel.opacity = PANEL_OPACITY_MAX;
    }


    resizeToPill() {
        const new_width = get_panel_width();
        const new_x = (global.screen_width - new_width) / 2;
        Main.layoutManager.panelBox.x = new_x;
        Main.layoutManager.panelBox.y = PANEL_Y;
        Main.layoutManager.panelBox.width = new_width;
        // the panelBox works as a placeholder for maximized windows. height = 0 makes windows maximized until the brim
        // with height = 0 the panel itself stays on the normal height.
        Main.layoutManager.panelBox.height = 0;
        Main.panel.opacity = PANEL_OPACITY_HIGH;
        this.makePanelRound();
    }

    resizeBackToVanilla() {
        Main.layoutManager.panelBox.x = 0;
        Main.layoutManager.panelBox.y = 0;
        Main.layoutManager.panelBox.width = global.screen_width;

        Main.panel.set_style("");
    }


    makePanelRound() {
        const new_radius = Main.panel.height;
        const make_round = () => {
            Main.panel.set_style("border-radius: " + new_radius + "px;");
        };

        make_round();

        // for some funny reason its better to repeat after a delay
        if (this.#timeoutRoundnessID != null)
            clearTimeout(this.#timeoutRoundnessID);
        this.#timeoutRoundnessID = setTimeout(make_round, 1000);
    }

    enableOverviewClosingBehaviour() {
        if (this.#mainOverviewListenerID2 != null)
            Main.overview.disconnect(this.#mainOverviewListenerID2);
        this.#mainOverviewListenerID2 = Main.overview.connect('hiding', this.makePanelRound.bind(this));
    }

    disableOverviewClosingBehaviour() {
        if (this.#mainOverviewListenerID2 != null)
            Main.overview.disconnect(this.#mainOverviewListenerID2);
        this.#mainOverviewListenerID2 = null;
        if (this.#timeoutRoundnessID != null)
            clearTimeout(this.#timeoutRoundnessID);
        this.#timeoutRoundnessID = null;
    }



    overviewOpeningBehaviour() {
        Main.overview._overview.first_child.first_child.margin_top = PANEL_Y + Main.panel.height + PANEL_Y;
    }

    enableOverviewOpeningBehaviour() {
        if (this.#mainOverviewListenerID1 != null)
            Main.overview.disconnect(this.#mainOverviewListenerID1);
        this.#mainOverviewListenerID1 = Main.overview.connect('showing', this.overviewOpeningBehaviour.bind(this));
    }

    disableOverviewOpeningBehaviour() {
        if (this.#mainOverviewListenerID1 != null)
            Main.overview.disconnect(this.#mainOverviewListenerID1);
        this.#mainOverviewListenerID1 = null;
    }

    temporarySetReactivityFalse(duration) {
        set_panel_reactivity(false);
        Main.panel.opacity = PANEL_OPACITY_LOW;
        if (this.#timeoutFadeinID != null)
            clearTimeout(this.#timeoutFadeinID);
        this.#timeoutFadeinID = setTimeout(this.resetReacticity.bind(this), duration);
    }

    resetReacticity() {
        if (this.#timeoutFadeinID)
            clearTimeout(this.#timeoutFadeinID);
        this.#timeoutFadeinID = null;
        set_panel_reactivity(true);
        Main.panel.opacity = PANEL_OPACITY_HIGH;
    }


    clickToHideBehaviour() {
        Main.panel.hide();

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
            Main.panel.disconnect(this.#mainPanelClickListenerID1);
        this.#mainPanelClickListenerID1 = Main.panel.connect('button-press-event', this.clickToHideBehaviour.bind(this));
    }
    disableClickToHideBehaviour() {
        this.resetReacticity();

        if (this.#mainPanelClickListenerID1 != null)
            Main.panel.disconnect(this.#mainPanelClickListenerID1);
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

        const theVeryEnd = isRight ? (Main.layoutManager.panelBox.x - PANEL_Y) : (PANEL_Y - Main.layoutManager.panelBox.x);
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
        const up_y = STILL_ON_SCREEN_PIXEL - Main.layoutManager.panelBox.y - Main.panel.height;
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
