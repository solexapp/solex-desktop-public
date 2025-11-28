# Logging configuration

If you run into something unexpected in Solex and want to see more detail about what's going on, you can tell it to log more data for 
specific modules. You can do this in a couple of ways.

## Command line
You can launch solex with the `--log:verbose` option, something like this:

```
solex --log:verbose VehicleShell,serialclient,udpclient
```

## `log_config` file

In the Solex app directory, create a file called `log_config.json` that looks like this:

```json
{
	"verbose": [
	    "VehicleShell",
	    "serialclient",
	    "udpclient"
	]
}
```

## Output

In either case, all possible log output from the `VehicleShell`, `serialclient` and `udpclient` modules will be emitted on the console. You can also capture this data in log files by setting the Log Level setting in the App Settings screen.

