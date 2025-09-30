
const MAXIMIZED_V_H = 3;
const TIMEOUT_STRETCH_AFTER_MAXIMIZE = 400;

export default class UndoMaximize {

    #timeoutStretchID = null;
    #windowManagerResizeListenerID1 = null;

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
        if (this.#windowManagerResizeListenerID1 != null)
            global.window_manager.disconnect(this.#windowManagerResizeListenerID1);
        this.#windowManagerResizeListenerID1 = null;

        if (this.#timeoutStretchID != null)
            clearTimeout(this.#timeoutStretchID);
        this.#timeoutStretchID = null;
    }
}