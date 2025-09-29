import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import Clutter from "gi://Clutter";

// import Shell from "gi://Shell";
// import St from "gi://St";

const PANEL_OPACITY_LOW = 100;
const PANEL_OPACITY_HIGH = 235;
const TIEMOUT_HIDDEN = 7000;
const TIMEOUT_FADEIN = 1500;
const TIMEOUT_STRETCH_AFTER_MAXIMIZE = 400;
const PANEL_Y = 4;

const set_panel_reactivity = (value) => {
    Main.panel.get_children().map(e => {
        e.get_children().map(f => { f.first_child.reactive = value; });
    });
}

export default class PanelPillExtension extends Extension {
    #mainOverviewListenerID1 = null;
    #mainOverviewListenerID2 = null;
    #mainPanelClickListenerID1 = null;
    #windowManagerListenerID1 = null;
    #mainPanelScrollListenerID1 = null;

    #timeoutVanishID = null;
    #timeoutFadeinID = null;
    #timeoutRoundnessID = null;
    #timeoutStretchID = null;


    enable() {
        this.enableClickToHideBehaviour();
        this.enableUndoMaximizeBehaviour();
        this.enableScrollBehaviour();
        this.enableOverviewOpeningBehaviour();
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
        // this code would work, if the panel didnt resize (with accessibility and keyboard indicator)
        //        const elem_width = Main.panel.get_children().map(child => child.width).reduce((a, b) => a + b);
        //        const min_width = elem_width + (Main.panel.height * 8);
        // until there is a nicer fix this will do:
        const min_width = Main.panel.height * 20;

        const new_width = Math.min(min_width, global.screen_width);
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
        const new_radius = Main.panel.height / 2;
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
        this.#mainOverviewListenerID2 = Main.overview.connect('hiding', this.makePanelRound);
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
        this.#mainOverviewListenerID1 = Main.overview.connect('showing', this.overviewOpeningBehaviour);
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
        this.#mainPanelClickListenerID1 = Main.panel.connect('button-press-event', this.clickToHideBehaviour);
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
        if (this.#windowManagerListenerID1 != null)
            global.window_manager.disconnect(this.#windowManagerListenerID1);
        this.#windowManagerListenerID1 = global.window_manager.connect_after('size-change', this.undoMaximizeBehaviour);
    }

    disableUndoMaximizeBehaviour() {
        if (this.windowManagerListenerID1 != null)
            global.window_manager.disconnect(this.#windowManagerListenerID1);
        this.#windowManagerListenerID1 = null;

        if (this.#timeoutStretchID != null)
            clearTimeout(this.#timeoutStretchID);
        this.#timeoutStretchID = null;
    }

    scrollBehaviour(a, event) {
        if (event.get_scroll_direction() == 2)
            Main.layoutManager.panelBox.x += 10;
        if (event.get_scroll_direction() == 3)
            Main.layoutManager.panelBox.x -= 10;
    }

    enableScrollBehaviour() {
        if (this.#mainPanelScrollListenerID1 != null)
            Main.panel.disconnect(this.#mainPanelScrollListenerID1);
        this.#mainPanelScrollListenerID1 = Main.panel.connect('scroll-event', this.scrollBehaviour)
    }

    disableScrollBehaviour() {
        if (this.#mainPanelScrollListenerID1 != null)
            Main.panel.disconnect(this.#mainPanelScrollListenerID1);
        this.#mainPanelScrollListenerID1 = null;
    }
}