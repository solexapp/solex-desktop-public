# Popup Windows

Solex provides a way to open popup windows from your plugin code, and populate them with your own UI and backing code.

## Opening a popup window

Opening a popup window is as simple as this:

```javascript
const { ipcRenderer } = require('electron');

function example() {
    const filePath = path.resolve(__dirname, "ui/my_window.html");

    ipcRenderer.send("open_new_window", {
        filePath: filePath,
        width: 400,
        height: 400,
        devTools: false
    }); 
}
```

The HTML file (`my_window.html` in the example) looks something like this:

```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title>My Window</title>

        <style>
            #content_popup {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
            }
        </style>

        <script id="plugin-init">
            console.log(`dirname=${__dirname}, pluginDir=${_pluginDir}`);
            const path = require("path");
            const panel = require(path.join(_pluginDir, "my_panel.js"));

            panel.loadIntoWindow($("#content_popup"));
        </script>
	</head>
	<body>
		<div id="content_popup">Loading content...</div>
	</body>
</html>
```

The `plugin-init` function is called when the HTML is loaded into the window, and gives the page a chance to initialize. The `_pluginDir` value is the path portion of the file path passed to `open_new_window` above. In the example above, a JavaScript class is used to enclose all the code dealing with the page in a Javascript module.

```javascript
const path = require("path");

class MyPanel {
    constructor(element) {
        element.load(path.join(_dirname, "panel_content.html"), () => {
            this.bindControls();
        });
    }

    bindControls() {
        $("#mybutton").on("click", this.onMyButtonClick.bind(this));
    }

    onMyButtonClick() {

    }
}

exports.loadIntoWindow = (element) => new MyPanel(element);
```

The `panel_content.html` file looks something like this:

```html
<style>
    #my_button {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: black;
        border-radius: 8px;
        border: 2px solid white;
    }
</style>
<div id="my_content">
    <button id="my_button">Click me</button>
</div>
```
That's basically it.
