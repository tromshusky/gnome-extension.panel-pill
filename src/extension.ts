import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import Automove from './Automove.js';
import OverviewFix from './OverviewFix.js';
import Pill from './Pill.js';


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
