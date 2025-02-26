#!/bin/bash

SNAKE_CASE_NAME=$(echo "$1" | sed 's/\([[:upper:]][[:upper:]]*\)/-\1/g' | sed 's/--*/-/g' | awk '{print substr(tolower($0), 2)}')
SELF_PATH=$(dirname "$0")/"$0"

find . -type f ! -path "$SELF_PATH" -name '*' -exec sed -i '' -e "s/Client-Features/$1/g" {} \; 2>/dev/null
find . -type f ! -path "$SELF_PATH" -name '*' -exec sed -i '' "s/client-features/$SNAKE_CASE_NAME/g" {} \; 2>/dev/null
