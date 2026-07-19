-- Add Google Gemini to BYOK provider enum
alter type public.llm_provider add value if not exists 'gemini';
