import os
import re
import sys
import json
from pathlib import Path

# =================================================================================================
# Project Documentation - Codebase Analysis Script
# 
# Purpose: This script scans a directory to generate a file tree and extract function signatures.
# usage: python3 analyze_codebase.py [target_directory]
# =================================================================================================

# Configuration
IGNORE_DIRS = {
    '.git', '.vscode', '.idea', 'node_modules', 'dist', 'build', 'coverage', 
    'target', 'vendor', '__pycache__', 'venv', '.env', '.gemini', '.agent',
    'bin', 'obj', 'out', 'debug', 'release'
}
IGNORE_EXTS = {
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', 
    '.ttf', '.eot', '.mp4', '.webm', '.mp3', '.wav', '.zip', '.tar', '.gz', 
    '.pyc', '.exe', '.dll', '.so', '.dylib', '.lock', '.log', '.map',
    '.DS_Store', '.class', '.o', '.obj'
}
MAX_FILE_SIZE_BYTES = 100 * 1024  # 100KB limit for full content reading

# Regex Patterns for all common languages
PATTERNS = {
    'python': r'def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)(?:\s*->\s*(.*?))?:',
    'javascript': r'(?:function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)|const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(?:async\s*)?\((.*?)\)\s*=>|([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)\s*\{)',
    'typescript': r'(?:function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)|const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(?:async\s*)?\((.*?)\)\s*=>|([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)\s*\{)',
    'rust': r'fn\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:<.*?>)?\s*\((.*?)\)(?:\s*->\s*(.*?))?\s*\{',
    'go': r'func\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)\s*(.*?)?\{',
    'dart': r'(?:[a-zA-Z0-9_<>]+)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)\s*(?:async)?\s*\{',
    'java': r'(?:public|protected|private|static|\s) +[\w\<\>\[\]]+\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(?:throws\s.*?)?\{',
    'kotlin': r'fun\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)(?:\s*:\s*[a-zA-Z0-9_<>]+)?\s*\{',
    'swift': r'func\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)(?:\s*->\s*[a-zA-Z0-9_<>]+)?\s*\{',
    'c': r'([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{',
    'cpp': r'([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(?:const)?\s*\{',
    'php': r'function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(?::\s*[a-zA-Z0-9_<>]+)?\s*\{'
}

LANGUAGE_MAP = {
    '.py': 'python',
    '.js': 'javascript', '.jsx': 'javascript', '.mjs': 'javascript',
    '.ts': 'typescript', '.tsx': 'typescript',
    '.rs': 'rust',
    '.go': 'go',
    '.dart': 'dart',
    '.java': 'java',
    '.kt': 'kotlin', '.kts': 'kotlin',
    '.swift': 'swift',
    '.c': 'c', '.h': 'c',
    '.cpp': 'cpp', '.hpp': 'cpp', '.cc': 'cpp',
    '.php': 'php'
}

def get_language(ext):
    return LANGUAGE_MAP.get(ext)

def extract_functions(content, lang):
    functions = []
    pattern = PATTERNS.get(lang)
    if not pattern:
        return []
    
    try:
        matches = re.finditer(pattern, content, re.MULTILINE | re.DOTALL)
        for match in matches:
            groups = [g for g in match.groups() if g]
            if groups:
                # Basic heuristic to map groups to Name/Args/Return
                # This depends heavily on the regex structure
                func_name = groups[0].strip()
                args = ""
                ret = ""
                
                if lang in ['c', 'cpp']: 
                    # C/CPP regex usually catches ReturnType Name Args
                    # So group 0 is Return, 1 is Name, 2 is Args
                    if len(groups) >= 3:
                        ret = groups[0].strip()
                        func_name = groups[1].strip()
                        args = groups[2].strip()
                elif lang == 'java':
                     # Java regex: capture Name, Args. Return type is often before name but not captured easily in one group
                     if len(groups) > 1: args = groups[1].strip()
                else: 
                     # Default: Name, Args, Return
                     if len(groups) > 1: args = groups[1].strip()
                     if len(groups) > 2: ret = groups[2].strip()
                
                # Cleanup
                args = " ".join(args.split())
                ret = " ".join(ret.split())
                
                functions.append({
                    "name": func_name,
                    "args": args,
                    "return": ret
                })
    except Exception:
        pass 
        
    return functions

def generate_tree(start_path):
    tree_lines = []
    files_data = []

    for root, dirs, files in os.walk(start_path):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        dirs.sort()
        files.sort()
        
        level = root.replace(start_path, '').count(os.sep)
        indent = '  ' * level
        folder = os.path.basename(root)
        if level > 0:
            tree_lines.append(f"{indent}📂 {folder}/")
        
        subindent = '  ' * (level + 1)
        for f in files:
            ext = os.path.splitext(f)[1]
            if ext in IGNORE_EXTS: continue
            
            tree_lines.append(f"{subindent}📄 {f}")
            
            file_path = os.path.join(root, f)
            rel_path = os.path.relpath(file_path, start_path)
            
            lang = get_language(ext)
            funcs = []
            try:
                if os.path.getsize(file_path) < MAX_FILE_SIZE_BYTES:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f_obj:
                        content = f_obj.read()
                        if lang:
                            funcs = extract_functions(content, lang)
            except Exception: pass
            
            if funcs:
                files_data.append({
                    "path": rel_path,
                    "functions": funcs[:25] # Limit top 25
                })
                
    return tree_lines, files_data

def main():
    if len(sys.argv) > 1:
        root_dir = sys.argv[1]
    else:
        root_dir = os.getcwd()
        
    root_dir = os.path.abspath(root_dir)
    
    if not os.path.exists(root_dir):
        print(f"Error: Directory '{root_dir}' does not exist.")
        sys.exit(1)
        
    print(f"Scanning directory: {root_dir}\n")
    
    tree, analysis = generate_tree(root_dir)
    
    print("# Project Structure")
    print("```text")
    for line in tree:
        print(line)
    print("```")
    print("\n# Code Analysis")
    print(f"Total files with functions: {len(analysis)}")
    
    for file_info in analysis:
        print(f"## File: `{file_info['path']}`")
        print("| Function | Inputs | Outputs |")
        print("| :--- | :--- | :--- |")
        for func in file_info['functions']:
            args = func['args'].replace('|', '\|')
            ret = func['return'].replace('|', '\|')
            if len(args) > 50: args = args[:47] + "..."
            print(f"| `{func['name']}` | `{args}` | `{ret}` |")
        print("\n")

if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:
        devnull = os.open(os.devnull, os.O_WRONLY)
        os.dup2(devnull, sys.stdout.fileno())
        sys.exit(1)
