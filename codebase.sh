#!/bin/bash

rm -f codebase.md

# Start the codebase.md file
echo "# Codebase Contents" > ./codebase.md

# Add the tree structure to the file
echo "## Project Structure" >> ./codebase.md
echo '```' >> ./codebase.md
tree -I "node_modules" >> ./codebase.md
echo '```' >> ./codebase.md
echo "" >> ./codebase.md

# Function to add file contents
add_file_contents() {
    local target_file="$2"
    echo "## File: $1" >> "$target_file"
    echo '```' >> "$target_file"
    cat "$1" >> "$target_file"
    echo '```' >> "$target_file"
    echo "" >> "$target_file"
}

# Add package.json and tsconfig.json
add_file_contents "./package.json" "./codebase.md"
add_file_contents "./tsconfig.json" "./codebase.md"

# Navigate to the src directory
cd src

# Loop through all files in the directory and subdirectories
find . -type f | while read -r file; do
    add_file_contents "$file" "../codebase.md"
done

# Navigate back to original directory
cd ..