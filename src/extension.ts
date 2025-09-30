import { Extension, ExtensionMetadata } from 'resource:///org/gnome/shell/extensions/extension.js';
import Scrolling from './Scrolling.js';
import OverviewFix from './OverviewFix.js';
import PanelUI from './PanelUI.js';

export const PANEL_Y = 4;
export const STILL_ON_SCREEN_PIXEL = 4;
export const DURATION_ASIDE = 7000;
export const DURATION_ASIDE_VERYLONG = 1000000;
export const DURATION_FADEIN = 800;
export const DURATION_FLICK = 200;
export const DURATION_RETURN = 2000;

export default class PanelPillExtension extends Extension {

    scrolling;
    overviewFix;
    panelUI;

    constructor(args: ExtensionMetadata) {
        super(args);
        this.panelUI = new PanelUI();
        this.scrolling = new Scrolling(this);
        this.overviewFix = new OverviewFix();
    }

    enable() {
        this.scrolling.enableScrollBehaviour();
        this.overviewFix.enableOverviewOpeningBehaviour();
        this.overviewFix.enableOverviewClosingBehaviour();
        this.panelUI.enable();
    }

    disable() {
        this.scrolling.disableScrollBehaviour();
        this.overviewFix.disableOverviewOpeningBehaviour();
        this.overviewFix.disableOverviewClosingBehaviour();
        this.panelUI.disable();
    }

}