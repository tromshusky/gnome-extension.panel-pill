var ANIMATION;
(function (ANIMATION) {
    ANIMATION[ANIMATION["NONE"] = 0] = "NONE";
    ANIMATION[ANIMATION["LEFT"] = 1] = "LEFT";
    ANIMATION[ANIMATION["RIGHT"] = 2] = "RIGHT";
    ANIMATION[ANIMATION["LEFTLEFT"] = 3] = "LEFTLEFT";
    ANIMATION[ANIMATION["RIGHTRIGHT"] = 4] = "RIGHTRIGHT";
    ANIMATION[ANIMATION["UP"] = 5] = "UP";
    ANIMATION[ANIMATION["DOWN"] = 6] = "DOWN";
})(ANIMATION || (ANIMATION = {}));
export default class MovePanel {
    #ongoingAnimation = ANIMATION.NONE;
    #pill;
    constructor(pill) {
        this.#pill = pill;
    }
    right(duration) {
        return this.#sideways(ANIMATION.RIGHT, duration, false);
    }
    left(duration) {
        return this.#sideways(ANIMATION.LEFT, duration, false);
    }
    rightStrong(duration) {
        return this.#sideways(ANIMATION.RIGHT, duration, true);
    }
    leftStrong(duration) {
        return this.#sideways(ANIMATION.LEFT, duration, true);
    }
    down(duration) {
        if (this.#pill.panelUI.isVisuallyDown())
            return false;
        this.#pill.panelUI.setPillXAkaLeftRight(true);
        this.#pill.panelUI.setHeightOversize(true);
        const onComplete = () => {
            this.#pill.panelUI.setHeightOversize(false);
        };
        this.#pill.panelUI.moveDown(duration, onComplete);
        return true;
    }
    up(duration, callback) {
        if (this.#pill.panelUI.hasNegativeTranslationY())
            return false;
        this.#pill.panelUI.resetXAkaLeftRight();
        this.#pill.panelUI.moveUp(duration, callback);
        return true;
    }
    #sideways(direction1, duration, strong) {
        // with Here is meant the target side / direction side
        const toTheRight = direction1 === ANIMATION.RIGHT;
        const theVeryEnd = toTheRight ?
            this.#pill.panelUI.getRightEnd() :
            this.#pill.panelUI.getLeftEnd();
        const panelIsAlreadyVeryHere = toTheRight ? this.#pill.panelUI.isVisuallyAtTheRightEnd() : this.#pill.panelUI.isVisuallyAtTheLeftEnd();
        if (panelIsAlreadyVeryHere)
            return false;
        // making a check so a half flick does not destroy a strong flick
        const hasAnimation = this.#ongoingAnimation !== ANIMATION.NONE;
        const alreadyMovingSoft = this.#ongoingAnimation === direction1;
        const requestEnforcingDirection = alreadyMovingSoft && strong;
        const invalidAnimationOverride = hasAnimation && !requestEnforcingDirection;
        if (invalidAnimationOverride)
            return false;
        const panelIsHereOrMid = toTheRight ?
            this.#pill.panelUI.isVisuallyRightOrMid() :
            this.#pill.panelUI.isVisuallyLeftOrMid();
        const relative_x = (strong || panelIsHereOrMid) ?
            theVeryEnd :
            0;
        const thisAnimation = (relative_x === 0) ? direction1 :
            (toTheRight ? ANIMATION.RIGHTRIGHT : ANIMATION.LEFTLEFT);
        this.#ongoingAnimation = thisAnimation;
        const onComplete = () => {
            if (this.#ongoingAnimation === thisAnimation)
                this.#ongoingAnimation = ANIMATION.NONE;
        };
        this.#pill.panelUI.moveLeftRight(relative_x, duration, onComplete);
        return true;
    }
}
