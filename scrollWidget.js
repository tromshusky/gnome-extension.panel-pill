import St from "gi://St";
import { PANEL_HEIGHT } from "./extension.js";
export const newScrollWidget = () => {
    const widget = new St.Widget();
    widget.x = 0;
    widget.y = 0;
    widget.height = PANEL_HEIGHT;
    widget.width = global.screen_width;
    widget.reactive = true;
    return widget;
};
