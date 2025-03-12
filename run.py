#!/usr/bin/env python3
import json
import os
import glob
import collections
from pathlib import Path

def convert_package_json(file_path):
    """
    Convert a package.json file to use ESM exports format instead of main/module.
    
    Args:
        file_path: Path to the package.json file
    """
    # Read the package.json file as text to preserve formatting and comments
    with open(file_path, 'r', encoding='utf-8') as f:
        file_content = f.read()
    
    # Also parse as JSON to modify the structure
    try:
        # Use OrderedDict to preserve field order
        package_data = json.loads(file_content, object_pairs_hook=collections.OrderedDict)
    except json.JSONDecodeError as e:
        print(f"Error parsing {file_path}: {e}")
        return False
    
    # Check if the file has both main and module fields
    if "main" not in package_data or "module" not in package_data:
        print(f"Skipping {file_path}: missing main or module field")
        return False
    
    # Get the values we need
    main_value = package_data["main"]
    module_value = package_data["module"]
    types_value = package_data.get("types")
    
    # Create a new OrderedDict to preserve ordering
    new_package_data = collections.OrderedDict()
    
    # Create exports object
    exports = collections.OrderedDict()
    if types_value:
        exports["types"] = f"./{types_value}"
    exports["default"] = f"./{module_value}"
    
    # Copy fields from original to new package data in order,
    # replacing main and module with exports at the first occurrence
    main_or_module_replaced = False
    
    for key, value in package_data.items():
        if key in ("main", "module") and not main_or_module_replaced:
            # Insert exports instead of main/module at their position
            new_package_data["exports"] = exports
            main_or_module_replaced = True
        elif key not in ("main", "module", "exports"):
            # Copy other fields
            new_package_data[key] = value
    
    # If we somehow missed replacing main/module, add exports at the end
    if not main_or_module_replaced:
        new_package_data["exports"] = exports
    
    # Write back to the file with proper formatting
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(new_package_data, f, indent=2)
    
    print(f"Converted {file_path}")
    return True

def main():
    packages_dir = "packages"
    
    # Check if packages directory exists
    if not os.path.isdir(packages_dir):
        print(f"Error: '{packages_dir}' directory not found")
        return
    
    # Find all package.json files in the packages directory and its subdirectories
    package_files = glob.glob(f"{packages_dir}/**/package.json", recursive=True)
    
    if not package_files:
        print(f"No package.json files found in '{packages_dir}'")
        return
    
    print(f"Found {len(package_files)} package.json files")
    
    # Convert each package.json file
    successful = 0
    for file_path in package_files:
        if convert_package_json(file_path):
            successful += 1
    
    print(f"Converted {successful} out of {len(package_files)} package.json files")

if __name__ == "__main__":
    main()