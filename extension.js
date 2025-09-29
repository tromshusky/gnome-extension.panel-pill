import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import Clutter from "gi://Clutter";

// import Shell from "gi://Shell";
// import St from "gi://St";

const panel_opacity_low = 100;
const panel_opacity_high = 235;
const timeout_hide = 7000;
const timeout_almostback = 1500;
const timeout_stretch_after_maximize = 400;

const set_opacity_panel_low = () => { Main.panel.opacity = panel_opacity_low; };
const set_opacity_panel_high = () => { Main.panel.opacity = panel_opacity_high; };
const set_panel_reactivity = (value) => {
    Main.panel.get_children().map(e => {
        e.get_children().map(f => { f.first_child.reactive = value; });
    });
}

export default class PanelPillExtension extends Extension {
    #mainOverviewListenerID1 = null;
    #mainOverviewListenerID2 = null;
    #mainPanelListenerID1 = null;
    #windowManagerListenerID1 = null;

    #timeoutVanishID = null;
    #timeoutFadeinID = null;
    #timeoutRoundnessID = null;
    #timeoutStretchID = null;


    makePanelRound(){
        const new_radius = Main.panel.height / 2;
        const make_round = () => {
            Main.panel.set_style("border-radius: " + new_radius + "px;");
        };
        make_round();
        if (this.#timeoutRoundnessID != null)
            clearTimeout(this.#timeoutRoundnessID);
        this.#timeoutRoundnessID = setTimeout(make_round, 1000);
    }

    enable() {
        const panel_parent = Main.panel.get_parent();
        const elem_width = Main.panel.get_children().map(child => child.width).reduce((a, b) => a + b);
        const min_width = elem_width + (Main.panel.height * 8);
        const new_width = Math.min(min_width, global.screen_width);
        const new_x = (global.screen_width - new_width) / 2;
        const new_y = 4;

        this.#mainPanelListenerID1 = Main.panel.connect('button-press-event', () => {
            Main.panel.hide();

            if (this.#timeoutVanishID != null)
                clearTimeout(this.#timeoutVanishID);

            this.#timeoutVanishID = setTimeout(() => {
                set_panel_reactivity(false);
                set_opacity_panel_low();
                Main.panel.show();
            }, timeout_hide);

            if (this.#timeoutFadeinID != null)
                clearTimeout(this.#timeoutFadeinID);

            this.#timeoutFadeinID = setTimeout(() => {
                set_panel_reactivity(true);
                set_opacity_panel_high();
            }, timeout_hide + timeout_almostback);

            return Clutter.EVENT_STOP; // Prevent further handling of the event
        });

        const onWindowMaximized = (wm, win) => {
            if (win.metaWindow.get_maximized() == 3) {
                const unmaxWindow = () => win.metaWindow.unmaximize(3);
                const stretchWindow = () => win.metaWindow.move_resize_frame(false, 0, 0, global.screen_width, global.screen_height);
                
                unmaxWindow();
                if (this.#timeoutStretchID)
                    clearTimeout(this.#timeoutStretchID);
                this.#timeoutStretchID = setTimeout(stretchWindow, timeout_stretch_after_maximize);
            };
        };

        this.#windowManagerListenerID1 = global.window_manager.connect_after('size-change', onWindowMaximized);

        panel_parent.x = new_x;
        panel_parent.y = new_y;
        panel_parent.width = new_width;
        Main.panel.opacity = panel_opacity_high;


        this.makePanelRound();
        this.#mainOverviewListenerID1 = Main.overview.connect('showing', () => {
            this.makePanelRound();
            Main.overview._overview.first_child.first_child.margin_top = new_y + Main.panel.height + new_y;
        });
        this.#mainOverviewListenerID2 = Main.overview.connect('hiding', () => {
            this.makePanelRound();
            Main.overview._overview.first_child.first_child.margin_top = new_y + Main.panel.height + new_y;
        });
    }

    disable() {
        const panel_parent = Main.panel.get_parent();

        Main.panel.disconnect(this.#mainPanelListenerID1);
        this.#mainPanelListenerID1 = null;

        global.window_manager.disconnect(this.#windowManagerListenerID1);
        this.#windowManagerListenerID1 = null;

        panel_parent.x = 0;
        panel_parent.y = 0;
        panel_parent.width = global.screen_width;

        set_panel_reactivity(true);
        Main.panel.opacity = 255;
        Main.panel.set_style("border-radius: " + 0 + "px;");

        Main.overview.disconnect(this.#mainOverviewListenerID1);
        this.#mainOverviewListenerID1 = null;
        Main.overview.disconnect(this.#mainOverviewListenerID2);
        this.#mainOverviewListenerID2 = null;

        if (this.#timeoutVanishID != null)
            clearTimeout(this.#timeoutVanishID);

        if (this.#timeoutFadeinID != null)
            clearTimeout(this.#timeoutFadeinID);

        if (this.#timeoutStretchID != null)
            clearTimeout(this.#timeoutStretchID);
        
        if (this.#timeoutRoundnessID != null)
            clearTimeout(this.#timeoutRoundnessID);
    }
}

