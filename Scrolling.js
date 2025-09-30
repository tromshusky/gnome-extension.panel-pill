import * as Main from "resource:///org/gnome/shell/ui/main.js";
import Clutter from "gi://Clutter";

const ANIMATION_NONE = -1;
const ANIMATION_LEFT = 0;
const ANIMATION_LEFTLEFT = 1;
const ANIMATION_RIGHT = 2;
const ANIMATION_RIGHTRIGHT = 3;
const ANIMATION_DOWN = 4;
const ANIMATION_UP = 5;
const SCROLL_DIRECTION_DOWN = 0;
const SCROLL_DIRECTION_LEFT = 3;
const SCROLL_DIRECTION_RIGHT = 2;
const SCROLL_DIRECTION_UP = 1;
const DURATION_ASIDE = 7000;
const DURATION_ASIDE_VERYLONG = 1000000;
const DURATION_FADEIN = 800;
const DURATION_FLICK = 200;
const DURATION_RETURN = 2000;
const STILL_ON_SCREEN_PIXEL = 4;


export default class Scrolling {
    #mainPanelScrollListenerID1 = null;
    #ongoingAnimation = ANIMATION_NONE;

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

    flickSideways(direction, dur, strong) {
        // with Here is meant the target side / direction side
        if ((direction !== ANIMATION_RIGHT) && (direction !== ANIMATION_LEFT)) Main.panel.scaleY = 20;
        const isRight = direction === ANIMATION_RIGHT;

        const hasAnimation = this.#ongoingAnimation !== ANIMATION_NONE;
        const alreadyMovingSoft = this.#ongoingAnimation === direction;
        const requestEnforcingDirection = alreadyMovingSoft && strong;
        const invalidAnimationOverride = hasAnimation && !requestEnforcingDirection;

        const theVeryEnd = isRight ? (Main.layoutManager.panelBox.x - global._panelpill.PANEL_Y) : (global._panelpill.PANEL_Y - Main.layoutManager.panelBox.x);
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

        if (direction === SCROLL_DIRECTION_UP) {
            this.flickUp(DURATION_FLICK, _ => {
                const dur = DURATION_ASIDE_VERYLONG;
                this.temporarySetReactivityFalse(dur + DURATION_RETURN + DURATION_FADEIN);
                this.flickUp(dur, _ => {
                    this.flickDown(DURATION_RETURN);
                });
            });
        } else if (direction === SCROLL_DIRECTION_DOWN) {
            this.flickDown(DURATION_FLICK) &&
                this.temporarySetReactivityFalse(DURATION_FLICK + DURATION_FADEIN);
        } else if (direction === SCROLL_DIRECTION_RIGHT) {
            this.flickRight(DURATION_FLICK);
        } else if (direction === SCROLL_DIRECTION_LEFT) {
            this.flickLeft(DURATION_FLICK);
        } else if (strongFlickLeft) {
            this.flickLeft(DURATION_FLICK, true);
        } else if (strongFlickRight) {
            this.flickRight(DURATION_FLICK, true);
        }
    }

}