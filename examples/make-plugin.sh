#!/bin/sh

TARGET=$1

if [ -z "$TARGET" ];
then
    TARGET=demo-plugin.zip
fi

if [ -f $TARGET ];
then
    rm $TARGET
fi

zip -r9 $TARGET ext

