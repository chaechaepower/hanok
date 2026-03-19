#!/bin/bash
for pid in $(ls /proc | grep -E '^[0-9]+$'); do
    if [ -f /proc/$pid/comm ] && [ "$(cat /proc/$pid/comm)" = "nginx" ]; then
        kill -HUP $pid
        break
    fi
done