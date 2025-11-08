#!/bin/sh
rm dist/*
make
loginctl kill-user 1000