
## Custom Cameras

You can create a custom camera module to interact with a camera on the vehicle. Merely putting the camera interface in a file in the `ext` directory won't work, however. You need to specify which camera you want to use in the `Vehicles` screen in Solex, under the vehicle in question. 

When the camera module is in the `ext` directory, specify it by name by putting `$ext/camera/MyCustomCamera`, and Solex will look for a `MyCustomCamera` module in `ext/camera`. 

The provided example doesn't do anything. Soon there will be an example that does, and it will be added here.

