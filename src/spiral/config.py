import os
from pathlib import Path


class Config:
    OLLAMA_BASE_URL = os.getenv("SPIRAL_OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_API_KEY = os.getenv("SPIRAL_OLLAMA_API_KEY", "")
    MODEL = os.getenv("SPIRAL_MODEL", "deepseek-v4-flash:cloud")

    PROJECT_DIR = Path(os.getenv("SPIRAL_PROJECT_DIR", str(Path.cwd())))
    ADR_PATH = PROJECT_DIR / "docs" / "adr" / "001-architecture.md"
    AGENTS_PATH = PROJECT_DIR / "AGENTS.md"

    SPIRAL_DIR = Path(
        os.getenv("SPIRAL_DIR", str(Path(__file__).resolve().parent.parent))
    )
    TRACES_DIR = SPIRAL_DIR / "traces"
    STATE_FILE = SPIRAL_DIR / "state.json"
    SKILLS_DIR = SPIRAL_DIR / "skills"
    STATUS_FILE = SPIRAL_DIR / "status.json"

    MAX_AGENT_ITERATIONS = int(os.getenv("SPIRAL_MAX_AGENT_ITERATIONS", "50"))
    MAX_VERIFICATION_RETRIES = int(os.getenv("SPIRAL_MAX_VERIFICATION_RETRIES", "3"))
    ENGINE_ANALYSIS_INTERVAL = int(os.getenv("SPIRAL_ENGINE_ANALYSIS_INTERVAL", "5"))
    VERIFICATION_TIMEOUT_S = int(os.getenv("SPIRAL_VERIFICATION_TIMEOUT_S", "300"))
    WATCH_POLL_INTERVAL_S = float(os.getenv("SPIRAL_WATCH_POLL_INTERVAL_S", "1.5"))
    AUTO_APPROVE = os.getenv("SPIRAL_AUTO_APPROVE", "false").lower() in (
        "1",
        "true",
        "yes",
    )
    CONTEXT_WINDOW_TOKENS = int(os.getenv("SPIRAL_CONTEXT_WINDOW_TOKENS", "32768"))
    COMPACTION_THRESHOLD = float(os.getenv("SPIRAL_COMPACTION_THRESHOLD", "0.8"))
    COMPACTION_KEEP_RECENT = int(os.getenv("SPIRAL_COMPACTION_KEEP_RECENT", "4"))
    STREAM_ENABLED = os.getenv("SPIRAL_STREAM", "false").lower() in ("1", "true", "yes")
    LLM_PROVIDER = os.getenv("SPIRAL_LLM_PROVIDER", "ollama").lower()
    MEMORY_DIR = Path(os.getenv("SPIRAL_MEMORY_DIR", str(SPIRAL_DIR / "memory")))
    AGENT_MODE = os.getenv("SPIRAL_AGENT_MODE", "normal").lower()
