from pathlib import Path

# Replace with your actual directory path
target_dir = Path(".")

# List only folders
folders = [f.name for f in target_dir.iterdir() if f.is_dir()]

print(folders)