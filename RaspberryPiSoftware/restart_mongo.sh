#!/bin/bash

# sudo /usr/bin/mongod --quiet --config /etc/mongodb.conf
if ! pgrep -x "mongod" > /dev/null
then
   echo "Repairing MongoDB"
   sudo rm /tmp/mongo*
   sudo rm /var/lib/mongodb/mongod.lock
   sudo /usr/bin/mongod --config /etc/mongodb.conf --journal&
   sleep 5
   sudo pkill -9 mongod
   sudo /usr/bin/mongod --config /etc/mongodb.conf --repair && sudo /usr/bin/mongod --config /etc/mongodb.conf --journal&
   echo "Done"
else
   echo "MongoDB already running"
fi

sleep 5
