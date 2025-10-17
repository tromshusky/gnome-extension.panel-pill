import St from "gi://St";
import { PANEL_HEIGHT } from "./extension.js";

export default class ScrollWidget extends St.Widget {
    constructor(){
        super();
        this.x = 0;
        this.y = 0;
        this.height = PANEL_HEIGHT;
        this.width = global.screen_width;
        this.reactive = true;
    }
}