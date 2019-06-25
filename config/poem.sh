#!/bin/bash
for f in poems/$1/*.wav
do
	aplay $f
done