import sys
import ollama
from mcp.server.fastmcp import FastMCP

# Initialize FastMCP Server
mcp = FastMCP("ollama-mcp")

@mcp.tool()
def generate(prompt: str) -> str:
    """
    Generate text or code using the local Ollama model instance.
    
    Args:
        prompt: The programming task, question, or refactoring prompt.
    """
    try:
        # Targeting your active 7b local coder model seen in your terminal list
        response = ollama.generate(
            model="qwen2.5-coder:7b",
            prompt=prompt
        )
        return response.get("response", "Error: No text generated.")
    except Exception as e:
        return f"Failed to communicate with local Ollama instance: {str(e)}"

if __name__ == "__main__":
    # FastMCP handles transport pipelines natively
    mcp.run()