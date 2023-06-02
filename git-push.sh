#!/bin/bash

# Get the commit message from user input
echo "Enter commit message:"
read commit_message

# Add all files to the Git repository
git add .

# Commit changes with the provided commit message
git commit -m "$commit_message"

# Push changes to the remote repository
git push
