#!/bin/bash

if [ -z "$1" ]; then
    NAME=`git branch --show-current`
else
    if [[ $1 == feature/* ]]; then
        NAME="$1"
    else
        NAME=feature/"$1"
    fi
fi

if [[ $NAME != feature/* ]]; then
    echo "Couldn't identify the feature branch. Either checkout to it or pass it as an argument. Exiting..."
    exit 1
fi

HOTFIX_NAME=${NAME/feature/hotfix}

git stash
git checkout "$NAME"
git checkout -b "$HOTFIX_NAME"
git rebase develop --onto master
