import St from "gi://St";
import { PANEL_HEIGHT } from "./extension.js";

export type WidgetType = St.Widget;


// this library doesnt know "global"
// @ts-expect-error 
const global = global;

export const newTopWidget = (): WidgetType => {
    const widget = new St.Widget();
    widget.x = 0;
    widget.y = 0;
    widget.height = PANEL_HEIGHT;
    widget.width = global.screen_width;
    widget.reactive = true;
    return widget;
};
