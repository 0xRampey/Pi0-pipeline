# Pi0-pipeline
Wearable architecture for the Raspberry Pi Zero

## Get started
```
git clone https://github.com/prampey/Pi0-pipeline.git   
cd Pi0-pipeline/src 
npm install 
npm start 
```  
## Requirements for Microphone

- Change Audio Device Settings to get better audio capture:  
 	- ```GUI: Preferences -> Audio Device Settings -> Sound Card (USB PnP ...), Increase volume to max -> Make Default -> OK``` 
  
## Requirements for BCTManager  

- Change the gpio multiplexing scheme for 13 and 18:  
 	- ```gpio_alt -p 13 -f 0```  
  - ```gpio_alt -p 18 -f 5```  
- espeak:  
 	- ```sudo apt-get install espeak```
  
## Requirements for ButtonManager
 
Permanently switch to pull-up mode on the pin connected to your button. This is required for correctly detecting button presses. Type the following on a RaspberryPi terminal:

``` gpio=14=pu ```
