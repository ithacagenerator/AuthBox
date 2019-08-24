#!/bin/bash
pm2 stop authbox
arduino-cli upload -p /dev/ttyACM0 --fqbn arduino:avr:uno -v -i ./RfidAuth/RfidAuth.arduino.avr.uno.hex
pm2 start authbox
