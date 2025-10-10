import * as Main from "resource:///org/gnome/shell/ui/main.js";
import PanelPillExtension, { PANEL_HEIGHT, PANEL_Y, STILL_ON_SCREEN_PIXEL } from "./extension.js";
import Clutter from "gi://Clutter";
import { layoutManager } from "@girs/gnome-shell/ui/main";



enum ANIMATION {
    NONE, LEFT, RIGHT, LEFTLEFT, RIGHTRIGHT, UP, DOWN
}

export default class FlickPanel {

    #ongoingAnimation = ANIMATION.NONE;
    #pill: PanelPillExtension;

    constructor(pill: PanelPillExtension) {
        this.#pill = pill;
    }

    sideways(direction1: ANIMATION.RIGHT | ANIMATION.LEFT, duration: number, strong?: boolean) {
        // with Here is meant the target side / direction side
        const isRight = direction1 === ANIMATION.RIGHT;
        const theVeryEnd = isRight ?
            (Main.layoutManager.panelBox.x - PANEL_Y) :
            (PANEL_Y - Main.layoutManager.panelBox.x);

        const panelIsAlreadyVeryHere = Main.layoutManager.panelBox.translation_x === theVeryEnd;

        if (panelIsAlreadyVeryHere) return false;

        // making a check so a half flick does not destroy a strong flick
        const hasAnimation = this.#ongoingAnimation !== ANIMATION.NONE;
        const alreadyMovingSoft = this.#ongoingAnimation === direction1;
        const requestEnforcingDirection = alreadyMovingSoft && strong;
        const invalidAnimationOverride = hasAnimation && !requestEnforcingDirection;

        if (invalidAnimationOverride) return false;

        const panelIsHereOrMid = isRight ?
            (Main.layoutManager.panelBox.translation_x >= 0) :
            (Main.layoutManager.panelBox.translation_x <= 0);

        const relative_x = (strong || panelIsHereOrMid) ?
            theVeryEnd :
            0;

        const thisAnimation =
            (relative_x === 0) ? direction1 :
                (isRight ? ANIMATION.RIGHTRIGHT : ANIMATION.LEFTLEFT);

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

    right(duration: number, strong?: boolean) {
        return this.sideways(ANIMATION.RIGHT, duration, strong);
    }

    left(duration: number, strong?: boolean) {
        return this.sideways(ANIMATION.LEFT, duration, strong);
    }

    #calculateTranslationXBasedOnMouse() {
        const [mouse_x] = global.get_pointer();
        const mouseRight = mouse_x < (global.screen_width / 3);
        const mouseLeft = mouse_x > (global.screen_width / 1.5);
        return mouseLeft ? (- Main.layoutManager.panelBox.x) :
            mouseRight ? Main.layoutManager.panelBox.x : 0;
    }


    down(duration: number) {
        if (Main.layoutManager.panelBox.translation_y == 0) return false;

        const new_translation_x = this.#calculateTranslationXBasedOnMouse();

        this.#pill.panelUI.setPillXAkaLeftRight();
        this.#pill.panelUI.setPillTranslationXAkaLeftRight(new_translation_x);
                Main.layoutManager.panelBox.height = PANEL_HEIGHT + 1;

        Main.layoutManager.panelBox.ease({
            // somehow the library in use doesnt support translation_x and translation_y
            // @ts-expect-error 
            translation_y: 0,
            duration: duration,
            mode: Clutter.AnimationMode.EASE_IN_OUT_BACK,
            onComplete: () => {
                Main.layoutManager.panelBox.height = PANEL_HEIGHT;
            }
        });

        return true;
    }


    up(duration: number, callb?: () => void) {
        if (Main.layoutManager.panelBox.translation_y < 0) return false;
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

}