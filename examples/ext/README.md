# Plugins

Solex makes use of plugins wherever possible. You can customize Solex's behavior pretty extensively with plugins, changing the color scheme, background image, adding buttons and other controls to various pages, adding custom commands to the console, providing your own video pipelines, making custom mission items, providing your own camera interfaces, etc.

## Making a plugin

The way to make a plugin is to create a directory for your plugin project, make an `ext` directory under it, and then under _that_ directory, make subdirectories for the things you want to add, such as a custom button action (`button_mapping`) or mission item (`missionitems`). 

## Installing plugins

### Testing/development
For testing, it's handy to make symlinks to your various components in the `ext` directory under Solex's home directory (`~/Solex`). In the `ext` directory there, make a corresponding directory (e.g. `button_mapping`) and then put a symlink there, linked to your mapping's .js file in your project directory. When you (re)start Solex, it will look in the various directories it needs to, find your plugin, and include it in the list of features that are available in the relevant area of the app.

### Distribution
Plugins are packaged and distributed as .zip files. They're "formally" installed by using the "Install Plugin" feature in the Settings screen in Solex. When you install a plugin, the zip file is stored under Solex's `plugin` directory. To remove a plugin, just delete the zip file for the plugin and restart Solex.

## Packaging a plugin

The included `make-plugin.sh` script is an example of a script that will make a zip file out of everything under the `ext` directory in your project. That's basically all there is to it.

