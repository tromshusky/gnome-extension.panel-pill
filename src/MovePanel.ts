import PanelPillExtension from "./extension.js";



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
        if (this.#pill.panelUI.isVisuallyDown()) return false;

        this.#pill.panelUI.setPillXAkaLeftRight(true);
        this.#pill.panelUI.setHeightOversize(true);

        const onComplete = () => {
            this.#pill.panelUI.setHeightOversize(false);
        }

        this.#pill.panelUI.moveDown(duration, onComplete);

        return true;
    }


    up(duration: number, callback?: () => void) {
        if (this.#pill.panelUI.hasNegativeTranslationY()) return false;

        this.#pill.panelUI.resetXAkaLeftRight();

        this.#pill.panelUI.moveUp(duration, callback);

        return true;
    }


    #sideways(direction1: ANIMATION.RIGHT | ANIMATION.LEFT, duration: number, strong?: boolean) {
        // with Here is meant the target side / direction side
        const toTheRight = direction1 === ANIMATION.RIGHT;
        const theVeryEnd = toTheRight ?
            this.#pill.panelUI.getRightEnd() :
            this.#pill.panelUI.getLeftEnd();

        const panelIsAlreadyVeryHere = toTheRight ? this.#pill.panelUI.isVisuallyAtTheRightEnd() : this.#pill.panelUI.isVisuallyAtTheLeftEnd();
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
        const onComplete = () => {
            if (this.#ongoingAnimation === thisAnimation)
                this.#ongoingAnimation = ANIMATION.NONE;
        };
        this.#pill.panelUI.moveLeftRight(relative_x, duration, onComplete)

       
        return true;
    }

}