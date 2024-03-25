## Location Sources

Location sources are used to provide something for a vehicle to follow. For example, you could have a `LocationSource` that is connected to a GPS attached to your computer, and have it emit locations as a `LocationSource`. Then a vehicle can be instructed to follow the location around. You could have a `LocationSource` that reads a list of locations from a file, and it would appear as a `LocationSource` that a vehicle can interact with. 

There are a few demos here, discussed below.

## `CircleLocationSource`

`CircleLocationSource` monitors the vehicle's location and runs a simple path in a circle around it. Mainly used for testing follow functions. Every time it gets a location update from the vehicle, it increments the current heading by 10 degrees and emits a new location listened to by the location-source listener. A vehicle listening to this source would get the new location as an event and would be able to act on it. The `Follow` functions in Solex are an example of such a listener.

## `PathLocationSource`

`PathLocationSource` is basically the same thing, but running a different-shaped path.


