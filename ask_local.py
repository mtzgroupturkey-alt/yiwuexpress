import os
import re
import time
import sys
import threading
import ollama

PROMPT_FILE = "prompt.txt"
IGNORE_DIRS = ['node_modules', '.git', '.next', 'build', 'dist', 'vendor']
ALLOWED_EXTS = ['.js', '.jsx', '.ts', '.tsx', '.css', '.php', '.html']

# Global flag to control the loading animation thread
is_loading = False

def loading_animation():
    """Renders a smooth spinning progress indicator in the console."""
    animation = [" [ / ]", " [ - ]", " [ \\ ]", " [ | ]"]
    idx = 0
    while is_loading:
        # Write the status to the terminal screen dynamically
        sys.stdout.write(f"\r🤖 Agent is analyzing code and fixing layout bugs...{animation[idx % len(animation)]}")
        sys.stdout.flush()
        idx += 1
        time.sleep(0.12)
    # Clear the loading line when done
    sys.stdout.write("\r" + " " * 70 + "\r")
    sys.stdout.flush()

def scan_project_for_menus():
    """Scans the entire workspace for files that likely control the mega menu."""
    candidate_files = []
    keywords = ["submenu", "mega", "dropdown", "nav"]
    
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for file in files:
            if any(file.endswith(ext) for ext in ALLOWED_EXTS):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if any(kw in content.lower() for kw in keywords):
                            candidate_files.append((filepath, content))
                except Exception:
                    continue
    return candidate_files

def process_and_edit():
    global is_loading
    
    if not os.path.exists(PROMPT_FILE):
        print(f"Error: Please create '{PROMPT_FILE}' first.")
        return

    with open(PROMPT_FILE, "r", encoding="utf-8") as f:
        user_prompt = f.read().strip()

    print("🔍 Scanning entire project for menu and submenu components...")
    suspect_files = scan_project_for_menus()

    if not suspect_files:
        print("❌ Could not find any files containing submenu or mega menu code.")
        return

    suspect_files.sort(key=lambda x: len(x[1]))
    target_files = suspect_files[:3] 

    print(f"🎯 Found {len(target_files)} suspect file(s).")

    file_contexts = ""
    for path, content in target_files:
        file_contexts += f"\n--- FILE PATH: {path} ---\n{content}\n"

    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert full-stack developer assistant. Analyze the provided project files "
                "to fix the user's issue. You must output your fix using the exact format block below:\n\n"
                "FILE_TO_UPDATE: [exact file path here]\n"
                "```\n"
                "[entire updated file code here]\n"
                "```\n\n"
                "Do not write any introductory text, greeting, or explanations. Only provide the format block."
            )
        },
        {
            "role": "user",
            "content": f"User Bug Report: {user_prompt}\n\nProject files to review:\n{file_contexts}"
        }
    ]

    # --- Start progress indicator loop in background thread ---
    is_loading = True
    spinner_thread = threading.Thread(target=loading_animation)
    spinner_thread.start()

    try:
        # Run local Ollama query
        response = ollama.chat(model="qwen2.5-coder:7b", messages=messages)
        generated_text = response["message"]["content"]

        # --- Stop progress indicator loop ---
        is_loading = False
        spinner_thread.join()

        # Parse the output properties
        file_match = re.search(r"FILE_TO_UPDATE:\s*([^\n`]+)", generated_text)
        code_blocks = re.findall(r"```[a-zA-Z]*\n(.*?)```", generated_text, re.DOTALL)

        if file_match and code_blocks:
            target_path = file_match.group(1).strip()
            clean_code = max(code_blocks, key=len).strip() 

            if os.path.exists(target_path):
                with open(target_path, "w", encoding="utf-8") as f:
                    f.write(clean_code)
                print(f"✅ BINGO! Analyzed project and successfully fixed: {target_path}")
                print("🔄 Refresh http://localhost:3001/ to check the mega menu submenus!")
            else:
                print(f"❌ Model tried to update '{target_path}', but that path wasn't found in your workspace folder layout.")
        else:
            print("❌ The model generated a text response but skipped our file save hooks. Here is the output:")
            print(generated_text)

    except Exception as e:
        is_loading = False
        if spinner_thread.is_alive():
            spinner_thread.join()
        print(f"❌ Execution failed: {str(e)}")

if __name__ == "__main__":
    process_and_edit()