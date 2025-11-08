import * as Main from "resource:///org/gnome/shell/ui/main.js";

export default class panelUI {
    static shrinkToPill() {
        Main.layoutManager.panelBox.x = global.screen_width * 3 / 8;
        Main.layoutManager.panelBox.width = global.screen_width / 4;
        Main.layoutManager.panelBox.y = 0;
        Main.layoutManager.panelBox.height = 4;
    }
    static expandToNormal() {
        Main.layoutManager.panelBox.x = 0;
        Main.layoutManager.panelBox.y = 0;
        Main.layoutManager.panelBox.width = global.screen_width;
        Main.layoutManager.panelBox.height = Main.panel.height;
    }
};