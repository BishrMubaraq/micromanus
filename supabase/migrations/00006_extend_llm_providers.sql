-- Add OpenRouter + Local LLM to BYOK provider enum
alter type public.llm_provider add value if not exists 'openrouter';
alter type public.llm_provider add value if not exists 'local';
