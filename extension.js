import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import Clutter from "gi://Clutter";

// import Shell from "gi://Shell";
// import St from "gi://St";

const PANEL_OPACITY_LOW = 100;
const PANEL_OPACITY_HIGH = 225;
const TIEMOUT_HIDDEN = 7000;
const TIMEOUT_FADEIN = 1500;
const TIMEOUT_STRETCH_AFTER_MAXIMIZE = 400;
const PANEL_Y = 4;
const PANEL_RATIO = 20;
const DURATION_VERYLONG = 999999999;
const DURATION_FLICK = 200;
const DURATION_ASIDE = DURATION_VERYLONG; // 7000;
const DURATION_RETURN = 2000;

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


    enable() {
        this.enableClickToHideBehaviour();
        //        this.enableUndoMaximizeBehaviour();
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
    }


    resizeToPill() {
        const new_width = get_panel_width();
        const new_x = (global.screen_width - new_width) / 2;
        Main.layoutManager.panelBox.x = new_x;
        Main.layoutManager.panelBox.y = PANEL_Y;
        Main.layoutManager.panelBox.width = new_width;
        Main.panel.opacity = PANEL_OPACITY_HIGH;
        this.makePanelRound();
    }

    resizeBackToVanilla() {
        Main.layoutManager.panelBox.x = 0;
        Main.layoutManager.panelBox.y = 0;
        Main.layoutManager.panelBox.width = global.screen_width;

        Main.panel.opacity = 255;
        Main.panel.set_style("");
    }


    makePanelRound() {
        const new_radius = Main.panel.height;
        const make_round = () => {
            Main.panel.set_style("border-radius: " + new_radius + "px;");
        };

        make_round();

        // for some funny reason its safer to repeat after a delay
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



    clickToHideBehaviour() {
        Main.panel.hide();

        if (this.#timeoutVanishID != null)
            clearTimeout(this.#timeoutVanishID);

        this.#timeoutVanishID = setTimeout(() => {
            set_panel_reactivity(false);
            Main.panel.opacity = PANEL_OPACITY_LOW;
            Main.panel.show();
        }, TIEMOUT_HIDDEN);

        if (this.#timeoutFadeinID != null)
            clearTimeout(this.#timeoutFadeinID);

        this.#timeoutFadeinID = setTimeout(() => {
            set_panel_reactivity(true);
            Main.panel.opacity = PANEL_OPACITY_HIGH;
        }, TIEMOUT_HIDDEN + TIMEOUT_FADEIN);

        return Clutter.EVENT_STOP; // Prevent further handling of the event
    }

    enableClickToHideBehaviour() {
        if (this.#mainPanelClickListenerID1 != null)
            Main.panel.disconnect(this.#mainPanelClickListenerID1);
        this.#mainPanelClickListenerID1 = Main.panel.connect('button-press-event', this.clickToHideBehaviour.bind(this));
    }
    disableClickToHideBehaviour() {
        set_panel_reactivity(true);
        set_opacity_panel_high();

        if (this.#mainPanelClickListenerID1 != null)
            Main.panel.disconnect(this.#mainPanelClickListenerID1);
        this.#mainPanelClickListenerID1 = null;

        if (this.#timeoutVanishID != null)
            clearTimeout(this.#timeoutVanishID);
        this.#timeoutVanishID = null;

        if (this.#timeoutFadeinID != null)
            clearTimeout(this.#timeoutFadeinID);
        this.#timeoutFadeinID = null;
    }

    undoMaximizeBehaviour(wm, win) {
        if (win.metaWindow.get_maximized() == 3) {
            const unmaxWindow = () => win.metaWindow.unmaximize(3);
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


    flickRight(dur, callb) {
        Main.layoutManager.panelBox.ease({
            translation_x: (Main.layoutManager.panelBox.x),
            duration: dur, mode: Clutter.AnimationMode.EASE_IN_OUT_BACK, onComplete: callb
        })
    }

    flickMiddle(dur, callb) {
        Main.layoutManager.panelBox.ease({
            translation_x: 0,
            duration: dur, mode: Clutter.AnimationMode.EASE_IN_OUT_BACK, onComplete: callb
        })
    }

    flickLeft(dur, callb) {
        Main.layoutManager.panelBox.ease({
            translation_x: (-Main.layoutManager.panelBox.x),
            duration: dur, mode: Clutter.AnimationMode.EASE_IN_OUT_BACK, onComplete: callb
        });
    }


    scrollBehaviour(a, event) {
        if (event.get_scroll_direction() == 1) {
            this.flickMiddle(DURATION_FLICK);
        } else if (event.get_scroll_direction() == 2) {
            this.flickRight(DURATION_FLICK, _ => {
//                Main.layoutManager.panelBox.width = global.screen_width / 2.5;
                this.flickRight(DURATION_ASIDE, _ => {
                    this.flickMiddle(DURATION_RETURN, _ => {
//                        Main.layoutManager.panelBox.width = get_panel_width();
                    });
                });
            });
        } else if (event.get_scroll_direction() == 3) {
            this.flickLeft(DURATION_FLICK, _ => {
//                Main.layoutManager.panelBox.width = global.screen_width / 2.5;
                this.flickLeft(DURATION_ASIDE, _ => {
                    this.flickMiddle(DURATION_RETURN, _ => {
//                        Main.layoutManager.panelBox.width = get_panel_width();
                    });
                });
            });
        };
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