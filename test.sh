#!/bin/bash
if [[ $ALEPATH == "" ]]
then
    echo -e "${RED}ERROR: Ale path (ALEPTAH) not set!${NC}"
    exit 1
fi

SOURCE="$PWD/dist/test.js"

cd $ALEPATH
./ale --source=$SOURCE --profile_path=./profile --unmute