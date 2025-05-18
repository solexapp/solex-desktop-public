# Location Sources

_Location Source_ (`LocationSource`) is a generic term for "something that can send location data". A _Location Listener_ (`LocationListener`) is something that can _receive_ location data. 

The most common/obvious example of where this might be useful is with vehicles, for example having one vehicle follow another, or pan to look at it as it moves around. 

## Basics

In Solex, a `Vehicle` appears in memory to represent a physical (or simulated) vehicle that's been connected. Vehicles in Solex act as both `LocationSource`s and `LocationListener`s. 

In the Terminal in the flight screen with a couple of vehicles connected, type `location sources` and a list will appear. These are current `LocationSources` that can be listened to. The column on the left is the location source's ID. 

```
Location Sources:

vehicle_101		Copter 101 (192.168.4.10)
vehicle_102		Rover 102 (192.168.4.9)
```

To make vehicle 101 listen to locations from vehicle_102, type these commands:

```
vehicle use 101
location listen vehicle_102
```

Now, each time `vehicle_102` moves, Copter 101 will be notified. If it has been commanded to follow or point at a location source, it will do so as `vehicle_102` moves around. (Note: You can't make a vehicle listen to itself.)

To stop listening to a location source, type `location detach vehicle_102` in the terminal. To detach the current vehicle from _all_ location sources, type 
`location detach`.

Note that merely listening to a location source doesn't actually _do_ anything, other than ensuring the listener sees locations as reported by the location source. It's useful for connecting a `LocationSource` to a `LocationListener` and verifying that the connection works properly.

## Actually doing something

`roi` and `follow` commands are available in Solex to make a vehicle follow or pan to a `LocationSource` as it moves. 

### ROI

To make the copter pan to look at the rover as it moves, open the Terminal and type the following commands:

```
vehicle use 101
roi follow vehicle_102
```

Now whenever the rover moves, the copter will pan to look at it. It will do this whether the copter is hovering in Guided mode, or is flying a mission in Auto mode. Whenever it can, the copter will pan to follow the rover's movements.

To stop following ROI, run `roi follow stop` in the Terminal. The copter will go back to its normal yaw.

### Follow

The make the copter _follow_ the rover as it moves, run the following commands in the Terminal:

```
vehicle use 101
follow vehicle_102 behind 8
```

Now, whenever the rover moves, the copter will move to a position 8 meters behind the rover. You can specify different relative positions by specifying `left`, `right`, `ahead` or `behind` in the `follow` command, for example:

```
follow vehicle_102 right 10
follow vehicle_102 left 10 smooth
follow vehicle_102 ahead 20 look smooth
```

#### `look`

The `look` parameter in the example above specifies that the copter should pan to point at the target vehicle as opposed to just flying alongside it. If specified, the copter will always point at the target vehicle. If not, it will yaw to match the heading of the target vehicle. (Note, this is the travel heading
of the target vehicle, not its yaw.)

#### `smooth`

Solex includes a ROI estimator to allow smoother movement between locations as they update. When `smooth` is _not_ specified, the following vehicle is instructed to navigate to the last-reported location. If locations arrive at long intervals, say, 5 seconds, the following vehicle will cruise to the specified location and then stop, then start again when a new location is reported. This can lead to a jerkiness in the way the following vehicle moves.

When `smooth` is specified, the ROI estimator synthesizes a stream of locations between the current and last-reported locations, at 5Hz. So if location `a` is reported and then `b` is reported 5 seconds later, the estimator uses the speed (distance / time) between the two locations and generates a path so that a new location is sent to the following vehicle every 200ms. This can be used to eliminate jerkiness when following slow or slowly-updating location sources.

*NOTE:* Be careful with follow when specifying small distances. For example, if you're following behind a vehicle and then run `follow vehicle_102 ahead 10`, the copter will try to get ahead of the target vehicle. If it's a copter following a rover, it should be fine (rovers don't fly). If there are 2 copters involved, it might end with a loud clattering noise and a shower of broken copters after the 2 copters collide in mid air. Another safety measure is to have the following copter fly at a different altitude than the target, so that crossing paths won't result in a collision (the following vehicle doesn't follow the target vehicle's altitude for this reason).

Also: Although it's not possible for a vehicle to follow itself, it _is_ possible for a vehicle to follow another, which could follow the first one. Don't do that. Eventually Solex will contain a safeguard to prevent such a "circular dependency", but until then, that's your job.

Note that it _is_ possible for a followed vehicle to use a following vehicle as a `roi` target, in which case the target vehicle will turn to watch the vehicle that's following it.


## Follow something other than a vehicle

Solex provides a web server that you can send locations to, at the `POST /location` endpoint. Anything posting appropriately-formatted location data to this endpoint can thus appear in Solex as a `LocationSource`. You could, for example, connect a GPS to a USB port on your laptop and run a program that reads data from it and posts location messages to the server, with a name of `my_cool_gps_thing`. A `location sources` command would show `my_cool_gps_thing` as a location source, and `follow my_cool_gps_thing behind 10` would cause the vehicle to follow it as it moves. 

You could also write a shell script that reads a list of locations from a text file and formulate `POST` requests, allowing a vehicle to follow a previously-recorded track if desired. Below is a quick-and-dirty example of doing that sort of thing.

### Posting locations

As mentioned above, the endpoint is as follows:

```
POST /location
```

Thus if your computer's IP address is 192.168.1.101 and the Solex web-server port is left at the default value of `2112`, the URL would be `http://192.168.1.101:2112/location`. 

The body of the `POST` request looks like this:

```javascript
{
	source: { id: "my_location_source", name: "My cool name" },
	where: {
		lat: (lat),
		lng: (lng),
		altAGL: (alt above ground),
		altMSL: (optional alt above sea level),
		heading: (optional direction, 0-359 degrees)
		speed: (optional speed, used by the ROI estimator)
	}
}
```

Posting the above data to this endpoint causes `my_location_source` to appear as a location source in Solex's terminal. To follow, type `roi follow my_location_source` in the terminal. Whenever a location is posted to the endpoint, the vehicle following it will be sent a ROI to focus on that point.

Quick and dirty example:

```sh
#!/bin/sh

filename=my_locations.txt
sourceId=my_location_source

while IFS= read -r line
do
    curl --header "Content-Type: application/json" \
        --request POST \
        --data "$line" \
        http://localhost:2112/location

    sleep 5

done < $filename

curl --header "Content-Type: application/json" \
    --request DELETE \
    http://localhost:2112/location/$sourceId
```

The file it reads in this example looks like this:
```
{"source": {"id": "my_location_source", "name": "My Location Source"}, "where": {"lat": 38.618976, "lng": -94.401866, "altAGL": 0}}
{"source": {"id": "my_location_source", "name": "My Location Source"}, "where": {"lat": 38.618974, "lng": -94.401864, "altAGL": 0}}
{"source": {"id": "my_location_source", "name": "My Location Source"}, "where": {"lat": 38.618972, "lng": -94.401862, "altAGL": 0}}
{"source": {"id": "my_location_source", "name": "My Location Source"}, "where": {"lat": 38.618970, "lng": -94.401860, "altAGL": 0}}
{"source": {"id": "my_location_source", "name": "My Location Source"}, "where": {"lat": 38.618968, "lng": -94.401858, "altAGL": 0}}
{"source": {"id": "my_location_source", "name": "My Location Source"}, "where": {"lat": 38.618966, "lng": -94.401856, "altAGL": 0}}
{"source": {"id": "my_location_source", "name": "My Location Source"}, "where": {"lat": 38.618964, "lng": -94.401854, "altAGL": 0}}
{"source": {"id": "my_location_source", "name": "My Location Source"}, "where": {"lat": 38.618962, "lng": -94.401852, "altAGL": 0}}
{"source": {"id": "my_location_source", "name": "My Location Source"}, "where": {"lat": 38.618960, "lng": -94.401850, "altAGL": 0}}
```

### External channel `ext_location`

You can also make an external input channel to Solex and specify locations from there. This is handy if, for example, you have a GPS attached to your device and you want to get locations from it and send them to Solex so a connected vehicle can see the locations and act on them if desired.

You do this by receiving location data from the GPS and converting it into JSON objects that look like this:

```javascript
    location: {
        // Don't remove this location source if idle/missing for up to 20s
        "dead_time_ms": 10000,
        "source": {
            "id": "my_cool_gps",
            "name": "My cool GPS",
            "description": "My cool GPS, like I said"
        },
        "where": {
            "lat": <lat>, lng: <lng>, alt: <alt>
        }
    }
```

Create a configuration file that looks like this:

```json
{
    "connections": [
        { "type": "udp", "port": 6789, "channel": "ext_location", "parser": "json" }        
    ]
}

```

...and save it in the `Solex/ext/ext_channel` directory.

When Solex starts, it will start listening for UDP packets on port `6789` and emitting on the `ext_location` channel. The `LocationSource` framework in Solex listens on this channel and any `location` events arriving on it are processed as external locations. 

From Solex's flight screen, you can open the terminal and type `location sources` and you'll see `my_cool_gps` included in them. When your vehicle is flying in Guided mode (or for a rover, just in Guided mode and armed), you can type `follow my_cool_gps behind 5` and your vehicle 
will start following the locations arriving via `my_cool_gps`. Stop following by running `follow stop` in the terminal.

The `dead_time_ms` param is optional, and specifies to `LocationSource` that it shouldn't drop your location source any sooner than the specified number of milliseconds. If you don't specify this, the timeout is 5s, at which point your `my_cool_gps` location source will be dropped. The `name` and `description` params are also optional.

Here's an [example location sender] (../examples/channel_sender/ext_location_flightlog.js) that takes the path of a Solex flight log (recorded by running `flightlog record start 1` from the terminal and then saving it after the flight), and plays it back at the rate it was recorded.


### Stopping the flow of locations

When you're done sending location data, you can just stop, at which point the vehicle will just hover in the air doing nothing, waiting for another location. Additionally, your location source will continue to show as an active location source, which isn't true. 

So when you're finished sending locations, call the `DELETE /location/my_location_source` endpoint to remove your location source. Any following vehicles will be notified, and stop following the source.

## Alternate Listeners

If you have an external program that can make use of location sources, you can also connect to a web socket provided by Solex to be notified of location updates. Connect to the web socket and subscribe to "location/(source_id)", and messages will be sent to your program with the location data, which you can store in a file, forward to a server, etc.




