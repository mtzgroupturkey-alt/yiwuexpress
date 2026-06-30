import sys
import ollama
from mcp.server.fastmcp import FastMCP

# Initialize FastMCP Server
mcp = FastMCP("ollama-mcp")

# Use the smaller model you just downloaded
MODEL_NAME = "qwen2.5-coder:1.5b"

@mcp.tool()
def generate(prompt: str) -> str:
    """
    Generate text or code using the local Ollama model instance.
    
    Args:
        prompt: The programming task, question, or refactoring prompt.
    """
    try:
        # Check if Ollama is responding
        try:
            ollama.list()
        except Exception as e:
            return f"ERROR: Ollama not responding. Is it running? Error: {str(e)}"
        
        print(f"Generating with {MODEL_NAME}...")
        
        # Generate response
        response = ollama.generate(
            model=MODEL_NAME,
            prompt=prompt,
            options={
                "num_predict": 1024,
                "temperature": 0.7,
                "top_p": 0.9
            }
        )
        
        return response.response or "Error: No text generated."
        
    except ollama.ResponseError as e:
        return f"ERROR: Ollama API Error: {str(e)}"
    except Exception as e:
        return f"ERROR: Failed to communicate with local Ollama instance: {str(e)}"

@mcp.tool()
def list_models() -> str:
    """List all available Ollama models."""
    try:
        models = ollama.list()
        model_names = [m.model for m in models.models]
        return f"Available models: {', '.join(model_names)}"
    except Exception as e:
        return f"ERROR: {str(e)}"

@mcp.tool()
def test_connection() -> str:
    """Test if Ollama is working properly."""
    try:
        import time
        start = time.time()
        response = ollama.generate(
            model=MODEL_NAME,
            prompt="Say 'OK' in one word.",
            options={"num_predict": 5}
        )
        elapsed = time.time() - start
        return f"Connection successful! Using model: {MODEL_NAME}\nResponse time: {elapsed:.2f}s\nResponse: {response.response or ''}"
        
    except Exception as e:
        return f"Connection failed: {str(e)}"

if __name__ == "__main__":
    # FastMCP handles all communication
    mcp.run()