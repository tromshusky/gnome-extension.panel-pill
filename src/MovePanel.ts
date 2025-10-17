import * as Main from "resource:///org/gnome/shell/ui/main.js";
import PanelPillExtension, { PANEL_Y, STILL_ON_SCREEN_PIXEL } from "./extension.js";
import Clutter from "gi://Clutter";



enum ANIMATION {
    NONE, LEFT, RIGHT, LEFTLEFT, RIGHTRIGHT, UP, DOWN
}

export default class MovePanel {

    #ongoingAnimation = ANIMATION.NONE;
    #pill: PanelPillExtension;

    constructor(pill: PanelPillExtension) {
        this.#pill = pill;
    }

    right(duration: number) {
        return this.#sideways(ANIMATION.RIGHT, duration, false);
    }

    left(duration: number) {
        return this.#sideways(ANIMATION.LEFT, duration, false);
    }

    rightStrong(duration: number) {
        return this.#sideways(ANIMATION.RIGHT, duration, true);
    }

    leftStrong(duration: number) {
        return this.#sideways(ANIMATION.LEFT, duration, true);
    }

    down(duration: number) {
        if (Main.layoutManager.panelBox.translation_y == 0) return false;

        this.#pill.panelUI.setPillXAkaLeftRight();
        this.#setPillTranslationBasedOnMouse();
        this.#pill.panelUI.setHeightOversize(true);

        Main.layoutManager.panelBox.ease({
            // somehow the library in use doesnt support translation_x and translation_y
            // @ts-expect-error 
            // translation_x: 0,
            translation_y: 0,
            duration: duration,
            mode: Clutter.AnimationMode.EASE_IN_OUT_BACK,
            onComplete: () => {
                this.#pill.panelUI.setHeightOversize(false);
            }
        });

        return true;
    }


    up(duration: number, callb?: () => void) {
        if (this.#pill.panelUI.hasNegativeTranslationY()) return false;
        const up_y = STILL_ON_SCREEN_PIXEL - Main.layoutManager.panelBox.y - Main.panel.height;

        this.#pill.panelUI.resetXAkaLeftRight();

        Main.layoutManager.panelBox.ease({
            // somehow the library in use doesnt support translation_x and translation_y
            // @ts-expect-error 
            translation_y: up_y,
            duration: duration,
            mode: Clutter.AnimationMode.EASE_IN_OUT_BACK,
            onComplete: callb
        });
        return true;
    }


    #sideways(direction1: ANIMATION.RIGHT | ANIMATION.LEFT, duration: number, strong?: boolean) {
        // with Here is meant the target side / direction side
        const toTheRight = direction1 === ANIMATION.RIGHT;
        const theVeryEnd = toTheRight ?
            this.#pill.panelUI.getRightEnd() :
            this.#pill.panelUI.getLeftEnd();

        const panelIsAlreadyVeryHere = Main.layoutManager.panelBox.translation_x === theVeryEnd;

        if (panelIsAlreadyVeryHere) return false;

        // making a check so a half flick does not destroy a strong flick
        const hasAnimation = this.#ongoingAnimation !== ANIMATION.NONE;
        const alreadyMovingSoft = this.#ongoingAnimation === direction1;
        const requestEnforcingDirection = alreadyMovingSoft && strong;
        const invalidAnimationOverride = hasAnimation && !requestEnforcingDirection;

        if (invalidAnimationOverride) return false;

        const panelIsHereOrMid = toTheRight ?
            this.#pill.panelUI.isVisuallyRightOrMid() :
            this.#pill.panelUI.isVisuallyLeftOrMid();

        const relative_x = (strong || panelIsHereOrMid) ?
            theVeryEnd :
            0;

        const thisAnimation =
            (relative_x === 0) ? direction1 :
                (toTheRight ? ANIMATION.RIGHTRIGHT : ANIMATION.LEFTLEFT);

        this.#ongoingAnimation = thisAnimation;

        Main.layoutManager.panelBox.ease({
            // somehow the library in use doesnt support translation_x and translation_y
            // @ts-expect-error 
            translation_x: relative_x,
            duration: duration,
            mode: Clutter.AnimationMode.EASE_IN_OUT_BACK,
            onComplete: () => {
                if (this.#ongoingAnimation === thisAnimation)
                    this.#ongoingAnimation = ANIMATION.NONE;
            }
        });
        return true;
    }

    #setPillTranslationBasedOnMouse() {
        const [mouse_x] = global.get_pointer();
        const mouseLeft = mouse_x < (global.screen_width / 3);
        const mouseRight = mouse_x > (global.screen_width / 1.5);
        return mouseLeft ? this.#pill.panelUI.setPillTranslationLEFT :
            mouseRight ? this.#pill.panelUI.setPillTranslationRIGHT :
                this.#pill.panelUI.setPillTranslationX0;
    }

}