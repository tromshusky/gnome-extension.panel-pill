import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import Automove from './Automove.js';
import OverviewFix from './OverviewFix.js';
import Pill from './Pill.js';

export const DURATION_ASIDE = 7000;
export const DURATION_ASIDE_VERYLONG = 1000000;
export const DURATION_FLICK = 200;
export const DURATION_RETURN = 2000;
// PANEL_HEIGHT will also be the gap above fullscreen windows
export const PANEL_HEIGHT = 2;
export const PANEL_OPACITY_HIGH = 225;
export const PANEL_OPACITY_LOW = 100;
export const PANEL_OPACITY_MAX = 255;
export const PANEL_XY_RATIO = 20;
export const PANEL_Y = 0;
export const STILL_ON_SCREEN_PIXEL = 4;
export const ROUND_CORNER_DELAY = 1000;
export const DOUBLE_SCROLL_DELAY = 300;

export const INVISIBLE_MOVE_CLOSER_MARGIN = 10;

export default class PanelPillExtension extends Extension {

    overviewFix: OverviewFix;
    pill: Pill;
    automove: any;

    constructor(em: any) {
        /*         
            the constructors are not supposed to do anything
            else but linking the class objects to each other
        */
        super(em);
        this.automove = new Automove(this);
        this.overviewFix = new OverviewFix(this);
        this.pill = new Pill(this);
    }


    enable() {
        // this library doesnt know "global"
        // @ts-expect-error 
        global._panelpill = this;
        this.automove.enable();
        this.pill.enable();
    }

    disable() {
        this.automove.disable();
        this.pill.disable();
    }

}
