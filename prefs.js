import Gio from 'gi://Gio';
import Adw from 'gi://Adw';

import { ExtensionPreferences, gettext } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const STR1 = "square-corners";
const settings = { [STR1]: ["Square Corners", "Wether the panel should have square corners"] };
const group1 = ["Appearance", "Configure the appearance of the panel", [STR1]];
const page1 = ["General", "dialog-information-symbolic", [group1]];
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

        my_settings.map(createPage).forEach(page => window.add(page));
    }
}