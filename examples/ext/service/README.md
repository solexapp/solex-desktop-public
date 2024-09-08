# Service Extensions

Service plugins ("Services") are modules that are loaded at app startup and persist for the app lifecycle. They can communicate with the vehicle, and do whatever you need them to do.

## `TimedPhoto` example
One (currently _the_) example in this directory is `TimedPhoto`, for taking photos on a time interval while the vehicle is flying regardless of flight mode. You can fly around in Loiter, Stabilize, AltHold, Guided, Auto, etc and as long as the vehicle is flying, it will take pictures at the configured interval. When the vehicle lands, it stops. 

## Configuration

It's pretty typical to need to configure a plugin, for example setting the time interval for `TimedPhoto` or specifying whether it does anything at all via the `enabled` property. Rather than requiring a plugin to define a configuration UI, a plugin can just expose properties for configuring it. These are included in the `info` data 
structure for the plugin, for example:

```javascript
        params: [
            { id: "enabled", name: "Enabled", type: "boolean" },
            { id: "photo_interval_seconds", name: "Photo interval (s)", type: "number", min: 0.1, max: 60 },
            { id: "caption", type: "string" },
            { id: "pick", name: "Pick field", type: "enum", 
                values: [
                    { id: "pick_1", name: "Pick 1" },
                    { id: "pick_2", name: "Pick 2" },
                    { id: "pick_3", name: "Pick 3" },
                ]
            }
        ]
```

The `type` of a param indicates what kind of control will appear in the property sheet for a plugin. A `boolean` will be a checkbox, a `number` will be a numeric field, `string` will be text, and an `enum` will be a selector. When you set values in the property sheet and hit `Save` on the panel, your plugin's `setConfig()` function will be called. You can optionally save the config in a file like the `TimedPhoto` plugin does, or just use the configuration values at runtime. 

## Installing a plugin

Service plugins are installed in the `$solex/ext/service` directory. Just copy your plugin there and restart Solex. 

## Using a plugin

Once you connect to a vehicle, open the flight screen, and you'll see a "services" button if any service plugins are installed. Click that button and you'll see a list of services. Click on one of them and the property panel will appear. Specify whatever values you want and click "Save". 

