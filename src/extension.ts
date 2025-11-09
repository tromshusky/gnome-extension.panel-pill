import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import Automove from './Automove.js';
import OverviewAndRoundingFix from './OverviewAndRoundingFix.js';
import Pill from './Pill.js';
import PanelUI from "./PanelUI.js";

export const AUTOMOVE_DISTANCE = 96;
export const AUTOMOVE_MS = 150;
export const COMEBACK_MS = 5000;
export const GAP_HEIGHT = 4;
export const OPACITY_SOLID = 255;
export const OPACITY_TRANSPARENT = 220;
export const ROUND_CORNER_DELAY = 1000;

export default class PanelPillExtension extends Extension {

    overviewFix: OverviewAndRoundingFix;
    pill: Pill;
    automove: Automove;

    //underscore properties will be availiable through the global variable for debugging purposes
    _PanelUI: any;

    constructor(em: any) {
        /*         
            the constructors are not supposed to do anything
            else but linking the class objects to each other
        */
        super(em);
        this.automove = new Automove(this);
        this.overviewFix = new OverviewAndRoundingFix(this);
        this.pill = new Pill(this);

        this._PanelUI = PanelUI;
    }


    enable() {
        // this library doesnt know "global"
        // @ts-expect-error 
        global._panelpill = this;
        this.pill.enable().automove.enable().overviewFix.enable();
    }

    disable() {
        this.automove.disable().pill.disable().overviewFix.disable();
    }

}
