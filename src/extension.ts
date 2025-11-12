import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import Automove from './Automove.js';
import OverviewAndRoundingFix from './OverviewAndRoundingFix.js';
import Pill from './Pill.js';
import PanelUI from "./PanelUI.js";

export const AUTOMOVE_DISTANCE = 96;
export const AUTOMOVE_MS = 150;
export const COMEBACK_MS = 5000;
export const COMEBACK_INACTIVE_MS = 500;
export const GAP_HEIGHT = 4;
export const OPACITY_SOLID = 255;
export const OPACITY_TRANSPARENT = 220;
export const LOW_OPACITY = 100;
export const ROUND_CORNER_DELAY = 300;
export const REACTIVATION_MS = 800;
export const FORCE_REACTIVATION_MS = 400;

export default class PanelPillExtension extends Extension {

    overviewFix: OverviewAndRoundingFix;
    pill: Pill;
    automove: Automove;
    panelUI: any;

    _PanelUI;

    constructor(em: any) {
        /*         
            the constructors are not supposed to do anything
            else but linking the class objects to each other
        */
        super(em);
        this.automove = new Automove(this);
        this.overviewFix = new OverviewAndRoundingFix(this);
        this.pill = new Pill(this);
        this.panelUI = new PanelUI(this);

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
