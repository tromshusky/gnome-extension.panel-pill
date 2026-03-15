import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences, gettext } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const _SQR_COR = "square-corners";
const _WIN_GAP = "window-gap";
const _PNL_GAP = "panel-gap";
const _ISLANDS = "islands";
const _HDE_BTN = "hide-button";
const _EZ_DOCK = "easy-dock";

const settings = {
    [_SQR_COR]: ["Square Corners", "Wether the panel should have square corners"],
    [_WIN_GAP]: ["Window Gap", "Wether there should be a gap below maximized windows.\n\nThis can fix some issues where the panel visually disappears behind windows, but still reacts to clicks (some XWayland apps for example)."],
    [_PNL_GAP]: ["Panel Gap", "Wether the panel should be a bit lowered, making it 'floating'."],
    [_ISLANDS]: ["Islands", "Wether the panel should be split into islands."],
    [_HDE_BTN]: ["Hide Button", "Wether the overview button should instead hide the panel."],
    [_EZ_DOCK]: ["Easy Dock", "Wether the dock should be shown on the desktop."],
};
const group1 = ["Appearance", "Configure the appearance of the panel", [_SQR_COR, _PNL_GAP, _ISLANDS]];
const group2 = ["Other", "Other panel related settings.", [_HDE_BTN, _WIN_GAP]];
const group3 = ["Dock", "Dock Settings", [_EZ_DOCK]];
const page1 = ["General", "dialog-information-symbolic", [group1, group2, group3]];
const my_settings = [page1];

export default class ExamplePreferences extends ExtensionPreferences {

    fillPreferencesWindow(window) {
        window._settings = this.getSettings();

        const createSetting = (settingID) => {
            const row = new Adw.SwitchRow({
                title: gettext(settings[settingID][0]),
                subtitle: gettext(settings[settingID][1])
            });
            window._settings.bind(
                settingID,
                row,
                'active',
                Gio.SettingsBindFlags.DEFAULT
            );
            return row;
        };

        const addResetToPage = (page) => {

            const resetButton = new Gtk.Button({ iconName: 'view-refresh-symbolic', valign: Gtk.Align.CENTER });
            const resetHandler = () => window._settings.list_keys().forEach(key => window._settings.reset(key));
            resetButton.connect('clicked', resetHandler);
            const resetRow = new Adw.ComboRow({ title: "Reset", subtitle: "Reset all preferences", });
            resetRow.add_suffix(resetButton);
            const resetGroup = new Adw.PreferencesGroup();
            resetGroup.add(resetRow);
            page.add(resetGroup);
            return page;

        };

        const createGroup = ([title, description, rows]) => {
            const pGroup = new Adw.PreferencesGroup({ title: title, description: gettext(description) });
            rows.map(createSetting).forEach(row => pGroup.add(row));
            return pGroup;
        };

        const createPage = ([title, iconName, groups]) => {
            const pPage = new Adw.PreferencesPage({ title: gettext(title), icon_name: iconName, });
            groups.map(createGroup).forEach(group => pPage.add(group));
            return pPage;
        };

        my_settings.map(createPage).map(addResetToPage).forEach(page => window.add(page));
    }
}