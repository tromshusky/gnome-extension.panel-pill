import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import Automove from './Automove.js';
import OverviewFix from './OverviewFix.js';
import Pill from './Pill.js';
import PanelUI from "./panelUI.js";

export const GAP_HEIGHT = 4;
export const AUTOMOVE_DISTANCE = 10;

export default class PanelPillExtension extends Extension {

    overviewFix: OverviewFix;
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
        this.overviewFix = new OverviewFix(this);
        this.pill = new Pill(this);

        this._PanelUI = PanelUI;
    }


    enable() {
        // this library doesnt know "global"
        // @ts-expect-error 
        global._panelpill = this;
        this.pill.enable().automove.enable();
    }

    disable() {
        this.automove.disable().pill.disable();
    }

}
