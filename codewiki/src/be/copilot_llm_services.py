"""
GitHub Copilot LLM service using LiteLLM for model access.
"""
from typing import Optional
import litellm
from litellm import completion

from codewiki.src.config import Config


def get_model(model: str) -> str:
    """
    Format model name for GitHub Copilot.
    
    Args:
        model: Model name (e.g., "gpt-4o", "claude-3.5-sonnet")
        
    Returns:
        Formatted model name with github_copilot/ prefix if needed
    """
    if not model.startswith("github_copilot/"):
        return f"github_copilot/{model}"
    print(f"Using model {model}.")
    return model


def call_llm(
    prompt: str,
    config: Config,
    model: str = None,
    temperature: float = 0.0,
    max_tokens: int = 32768
) -> str:
    """
    Call GitHub Copilot LLM with the given prompt using LiteLLM.
    
    Args:
        prompt: The prompt to send
        config: Configuration containing LLM settings
        model: Model name (e.g., "gpt-4o", "claude-3.5-sonnet", "o1-preview")
               If None, uses config.main_model
        temperature: Temperature setting (0.0-1.0)
        max_tokens: Maximum tokens in response
        
    Returns:
        LLM response text
        
    Examples:
        >>> response = call_llm("Explain this code", config, model="gpt-4o")
        >>> response = call_llm("Generate docs", config, model="claude-3.5-sonnet")
    """
    if model is None:
        model = config.main_model
    
    # Format model name for GitHub Copilot
    # LiteLLM expects format: github_copilot/<model_name>
    copilot_model = get_model(model)
    
    # Configure LiteLLM for GitHub Copilot
    # The API key should be a GitHub token with Copilot access
    litellm.api_key = config.llm_api_key
    
    # Optional: Set base URL if using a custom endpoint
    if config.llm_base_url:
        litellm.api_base = config.llm_base_url
    
    # Call the LLM
    response = completion(
        model=copilot_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
        max_tokens=max_tokens,
        extra_headers={
            "editor-version": "vscode/1.85.1",
            "Copilot-Integration-Id": "vscode-chat"
        }
    )
    
    return response.choices[0].message.content


def call_llm_with_system(
    system_prompt: str,
    user_prompt: str,
    config: Config,
    model: str = None,
    temperature: float = 0.0,
    max_tokens: int = 32768
) -> str:
    """
    Call GitHub Copilot LLM with system and user prompts.
    
    Args:
        system_prompt: System prompt for context/instructions
        user_prompt: User's actual prompt
        config: Configuration containing LLM settings
        model: Model name (defaults to config.main_model)
        temperature: Temperature setting
        max_tokens: Maximum tokens in response
        
    Returns:
        LLM response text
    """
    if model is None:
        model = config.main_model
    
    # Format model name for GitHub Copilot
    copilot_model = get_model(model)
    
    # Configure LiteLLM
    litellm.api_key = config.llm_api_key
    if config.llm_base_url:
        litellm.api_base = config.llm_base_url
    
    # Call with system and user messages
    response = completion(
        model=copilot_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=temperature,
        max_tokens=max_tokens,
        extra_headers={
            "editor-version": "vscode/1.85.1",
            "Copilot-Integration-Id": "vscode-chat"
        }
    )
    
    return response.choices[0].message.content


def call_llm_streaming(
    prompt: str,
    config: Config,
    model: str = None,
    temperature: float = 0.0,
    max_tokens: int = 32768
):
    """
    Call GitHub Copilot LLM with streaming response.
    
    Args:
        prompt: The prompt to send
        config: Configuration containing LLM settings
        model: Model name (defaults to config.main_model)
        temperature: Temperature setting
        max_tokens: Maximum tokens in response
        
    Yields:
        Chunks of the response text as they arrive
        
    Example:
        >>> for chunk in call_llm_streaming("Write a story", config):
        ...     print(chunk, end="", flush=True)
    """
    if model is None:
        model = config.main_model
    
    # Format model name for GitHub Copilot
    copilot_model = get_model(model)
    
    # Configure LiteLLM
    litellm.api_key = config.llm_api_key
    if config.llm_base_url:
        litellm.api_base = config.llm_base_url
    
    # Call with streaming enabled
    response = completion(
        model=copilot_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
        max_tokens=max_tokens,
        stream=True,
        extra_headers={
            "editor-version": "vscode/1.85.1",
            "Copilot-Integration-Id": "vscode-chat"
        }
    )
    
    # Yield chunks as they arrive
    for chunk in response:
        if hasattr(chunk.choices[0], 'delta') and hasattr(chunk.choices[0].delta, 'content'):
            content = chunk.choices[0].delta.content
            if content:
                yield content


def get_available_models() -> list[str]:
    """
    Get list of available GitHub Copilot models.
    
    Returns:
        List of model names that can be used with GitHub Copilot
        
    Note:
        These models are available through GitHub Copilot:
        - gpt-4o: OpenAI's GPT-4 Omni model
        - gpt-4o-mini: Smaller, faster GPT-4 variant
        - claude-3.5-sonnet: Anthropic's Claude 3.5 Sonnet
        - o1-preview: OpenAI's O1 preview model
        - o1-mini: Smaller O1 variant
    """
    return [
        "gpt-4o",
        "gpt-4o-mini",
        "claude-sonnet-4",
        "claude-sonnet-4.5",
        "gemini-3-pro-preview",
        "gpt-5",
        "gpt-5-mini",
        "o1-preview",
        "o1-mini"
    ]


def validate_model(model: str) -> bool:
    """
    Validate if a model is available through GitHub Copilot.
    
    Args:
        model: Model name to validate
        
    Returns:
        True if model is available, False otherwise
    """
    available = get_available_models()
    # Remove github_copilot/ prefix if present
    model_name = model.replace("github_copilot/", "")
    return model_name in available
