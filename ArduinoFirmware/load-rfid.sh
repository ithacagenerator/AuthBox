#!/bin/bash

arduino-cli upload -p /dev/ttyACM0 --fqbn arduino:avr:uno -v -i ./RfidAuth/RfidAuth.arduino.avr.uno.hex

