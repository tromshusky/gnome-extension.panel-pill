import { Extension, ExtensionMetadata } from 'resource:///org/gnome/shell/extensions/extension.js';
import Scrolling from './Scrolling.js';
import OverviewFix from './OverviewFix.js';
import PanelUI from './PanelUI.js';

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

export default class PanelPillExtension extends Extension {

    scrolling;
    overviewFix;
    panelUI;

    constructor(args: ExtensionMetadata) {
        super(args);
        this.panelUI = new PanelUI(this);
        this.scrolling = new Scrolling(this);
        this.overviewFix = new OverviewFix(this);
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
