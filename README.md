# Pi0-pipeline
Wearable architecture for the Raspberry Pi Zero

## Requirements for BCTManager  

 - espeak:  
 	- ```sudo apt-get install espeak```
  
## Requirements for ButtonManager
 
Permanently switch to pull-up mode on the pin connected to your button. This is required for correctly detecting button presses. Type the following on a RaspberryPi terminal:

``` gpio=14=pu ```
