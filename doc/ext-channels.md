# External Channels

It doesn't happen often, but sometimes you need to get data from an external data source and display it somewhere in the app.

One example is about a specific customer. They have a large boat with an engine on it, and they need to display engine RPM, fuel level, 
engine temperature and other data on the HUD of the flight screen.

It's possible to go to the effort of making a custom mavlink message to get this data from the vehicle to the ground station over the mavlink connection, but this provides a different way to do it that doesn't involve making a new mavlink message, doing a custom build of ArduPilot, etc.

In this case, the customer had an engineer who wrote a program to connect to the engine's ECU and report the data on the console. This process runs on the vehicle (for obvious reasons) on a companion computer. So in their case it's a simple matter to send the data over the network to the ground station.

Solex includes an `ExternalChannel` mechanism that allows connections to be made with external software like this and expose it as named events that can be consumed by UI elements. So there are 2 parts to this:

When Solex connects to the aforementioned boat, there's some code that does something like this:

```javascript
const connection = ExternalConnectShell.connect({
	type: ExternalConnectShell.TYPE_UDP,
	port: 3456,
	channel: "engine",
	parser: "json"
});
```

At that point, Solex is listening for any messages that come in on the (agreed-upon) port.

The basic idea is that once a connection is made and data starts arriving on it, it's parsed by the specified parser and data elements in the parsed data are broadcast through a channel called `engine`.

For example, suppose the engine software sends this sort of data every 100ms or so:
```
{ "rpm": 4300, "fuel_level": 50, "temperature": 120, "load": 0.7 }
```

When this data gets parsed, the parser checks to see which fields in the incoming data have actually changed from the last time it got the data and emit events only for data that has changed. Suppose `rpm` is changing very frequently, but `fuel_level` only changes every few minutes. In that case `rpm` will be the only event sent and `fuel_level` will only be sent when it changes.

The UI code, meanwhile, does something like this:

```javascript
const channel = ExternalProcChannels.getChannel("engine")
channel
	.on("rpm", (rpm) => {
		// update UI to show RPM
	})
	.on("temperature", (temperature) => {
		// Show engine temperature in the UI
	})
	.on("fuel_level", (level) => {
		// Update the "gas gauge"
	});
```

There is also a way to connect to external programs running on the same machine as Solex, via `ExternalProcShell`. It's similar, but Solex actually launches the program itself at startup like this:

```javascript
const proc = ExternalProcShell.launch({
	cmd: "/some/path/to/program",
	params: [ "param1", "param2" ], // optional
	channel: "engine",
	parser: "json"
});
```

The UI code would be largely the same, except the data is coming from a local process instead of a remote one.

### Using with a vehicle

Solex currently supports the placement of configuration files in the `Solex/ext/vehicle_ext_channel` directory for specific vehicle types. The types are:

- `copter`
- `plane`
- `rover`
- `vtol`
- `boat`

Place a file named (for example) `boat.json` in this directory with contents like this:

```json
{
	"connections": [
		{ "type": "udp", "port": 3456, "channel": "engine", "parser": "json" }
	]
}
```

When connecting to ArduRover with a `FRAME_CLASS` param of `2` (boat), Solex will load this file and create an `engine` channel. Any parseable JSON data sent to the ground station's host computer's IP on port 3456 will be parsed and events will be emitted on the `engine` channel as the values change. Components in the app (e.g. UI components) can then subscribe to the `engine` channel and display the values they receive.
