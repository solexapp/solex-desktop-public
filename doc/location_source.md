# Location Sources

_Location Source_ is a generic term for "something that can send location data". The most common/obvious example of this is a vehicle, but location data
can come from other sources too. For example, a GPS attached to a USB port on the computer running Solex could be used to tell location listeners where the operator currently is. 

When applied strictly to vehicles, a vehicle can observe the movements of another vehicle on the network and take action if desired. For example, it could follow the vehicle at a specific distance and position relative to the target vehicle, or rotate to point at the target vehicle.

## Basic commands

In the Terminal in the flight screen with a couple of vehicles connected, type `location sources` and a list of location sources (id and name) will be shown.
Suppose you have two vehicles, "Copter 101" and "Rover 102". Vehicles in Solex are `LocationSource`s, and register with the `LocationSource` sub-system at the time they connect. So the `location sources` command will display the following:

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

Now, each time `vehicle_102` moves, Copter 101 will be notified. If it has been commanded to follow or point at a location source, it will do so as `vehicle_102` moves around. To make the listening vehicle actually _do_ something in response to the target vehicle's movement, the upcoming `roi` and `follow` commands can be used.

To stop listening to a location source, type `location detach vehicle_102` in the terminal. To detach the current vehicle from _all_ location sources, type `location detach`.


## External Location Sources

Solex provides a web server that you can send locations to, and appear as a location source for a vehicle to follow or otherwise act on. The endpoint is as follows: 

```
POST /location
```

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
	}
}
```

Posting the above data to this endpoint causes `my_location_source` to appear as a location source in Solex's terminal. To follow, type `roi follow my_location_source` in the terminal. Whenever a location is posted to the endpoint, the vehicle following it will be sent a ROI to focus on that point.

It's therefore possible to write a script that sends location data at intervals and cause the vehicle to pan to or follow the location.

### Stopping the flow of locations

When you're done sending location data, you can just stop, at which point the vehicle will just hover in the air doing nothing. You can detach from it
with the `location detach my_location_source` command in the terminal. This works, but is messy. Your now-terminated location source will still show as available from the `location sources` command.

So it's advisable to explicitly notify that your location source is finished by calling the `DELETE /location/my_location_source` endpoint. This removes `my_location_source` as a source, and it will no longer show as something a vehicle can follow.

