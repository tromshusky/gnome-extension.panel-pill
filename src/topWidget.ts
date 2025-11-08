import St from "gi://St";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

export type WidgetType = St.Widget;


export const newTopWidget = (existingWidget?: WidgetType): WidgetType => {
    const widget = new St.Widget();
    if (existingWidget !== undefined) {
        widget.x = existingWidget.x;
        widget.y = existingWidget.y;
        widget.height = existingWidget.height;
        widget.width = existingWidget.width;
        existingWidget.get_parent()?.add_child(widget);
    } else {
        widget.x = 0;
        widget.y = 0;
        widget.height = Main.panel.height;
        widget.width = global.screen_width;
        Main.layoutManager.panelBox.get_parent()?.add_child(widget);
    }
    widget.reactive = true;
    return widget;
};
