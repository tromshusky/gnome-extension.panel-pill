const { St, Clutter } = imports.gi;
const Main = imports.ui.main;
const Shell = imports.gi.Shell;

const panel_height = Main.panel.height;
const panel_parent = Main.panel.get_parent();
const elem_width = Main.panel.get_children().map(child=>child.width).reduce((a,b)=>a+b);
const min_width = elem_width + (panel_height*8);
const screen_width = global.screen_width;
const new_width = Math.min(min_width,screen_width);
const new_x = (screen_width - new_width) / 2;
const new_y = panel_height/2;
const new_radius = panel_height/2;

class OverviewExtension {
    constructor() {
        this._overviewStateChangedId = null;
    }

    enable() {
        panel_parent.x = new_x;
        panel_parent.y = new_y;
        panel_parent.width = new_width;
        Main.panel.set_style("border-radius: " + new_radius + "px;");
        this._overviewStateChangedId = Main.overview.connect('showing', () => {
            Main.overview._overview.first_child.first_child.margin_top = new_y + panel_height + new_y;
        });
    }

    disable() {
        panel_parent.x = 0;
        panel_parent.y = 0;
        panel_parent.width = screen_width;
        Main.panel.set_style("border-radius: " + 0 + "px;");
        if (this._overviewStateChangedId) {
            Main.overview.disconnect(this._overviewStateChangedId);
            this._overviewStateChangedId = null;
        }
    }
}

function init() {
    return new OverviewExtension();
}

