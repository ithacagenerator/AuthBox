#!/bin/bash

arduino-cli compile --fqbn arduino:avr:uno --build-cache-path /tmp/arduino --build-path `pwd`/build -v ./RfidAuth

