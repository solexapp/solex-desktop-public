# Custom Preflight Checks

You can define pre-flight checklists to provide an indication to the pilot that a given connected vehicle is ready to arm and fly. 
Typically these include checks for GPS status (satellites, HDOP, etc), minimum-desired battery level, etc. These are all defined as individual 
checklist items. You can see the preflight checklist in the flight screen, with a button that shows in green if the vehicle is considered ready
to arm, or red otherwise. 

There are 2 types of checklist item: `manual`, which is for things you have to do when making a vehicle ready (attach props, connect linkages, etc). You complete a manual checklist item by clicking a checkbox The other type is `auto`, where properties of the vehicle are monitored by the system and and checked when they pass a prescribed condition.

For example, a checklist item can monitor the number of visible GPS satellites. It does this by monitoring the `gps.satellites` vehicle property and auto-completing when the property's value meets or exceeds a specific minimum value. In the Preflight Checklist page of the app, you can select from a (large) list of vehicle properties for an `auto` checklist item you're making.

Most `auto` pre-flight checks function this way, since the built-in list of things to monitor is somewhat large. 

### Custom checks
Your vehicle may have devices attached to it which require pre-flight checks that aren't directly supported by the flight controller, such as an external payload or payload interface that needs to be checked in a specific way. 

For this, you can create a module that contains logic to perform the needed checks and set vehicle properties to indicate a given subsystem's readiness for flight. Having done that, you can create a normal `auto`-type checklist item that monitors a custom property provided by your checklist module and auto-completes when the property's value matches the expression in the checklist item.

The attached `payload_check` module shows a basic example of a fictional payload being set to update a vehicle property `laser.status` to a 
specific value. The `sample.preflight` checklist file shows the layout of an `auto` checklist item that monitors the property and auto-completes when `laser.status` reaches a value of 3.

