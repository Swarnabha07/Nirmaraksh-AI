# ⚡ Nirmaraksh-AI

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:00C6FF,100:7F00FF&height=180&section=header&text=Nirmaraksh-AI&fontSize=52&fontColor=ffffff&animation=fadeIn&fontAlignY=35" width="100%"/>
</p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=22&duration=2800&pause=900&color=00C6FF&center=true&vCenter=true&width=700&lines=Think.+Understand.+Act.;Multi-Model+AI+Assistant;Groq+%7C+Gemini+%7C+Claude+%7C+OpenAI;Memory+%7C+Agents+%7C+Actions+%7C+UI" alt="Typing animation" />
</p>

<p align="center">
  <b>🧠 Voice • Tools • Agents • Intelligence</b>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-api-key-configuration">API Keys</a> •
  <a href="#-contributors">Contributors</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.x-3776AB?logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/PyQt6-Desktop-41CD52?logo=qt&logoColor=white"/>
  <img src="https://img.shields.io/badge/Gemini-Live%20API-4285F4?logo=google&logoColor=white"/>
  <img src="https://img.shields.io/badge/Groq-API-F55036"/>
  <img src="https://img.shields.io/badge/OpenAI-API-412991?logo=openai&logoColor=white"/>
  <img src="https://img.shields.io/badge/Claude-Anthropic-D97757"/>
</p>

---

## 🌌 What is Nirmaraksh-AI?

**Nirmaraksh-AI** is a modular personal AI assistant designed around a central orchestrator, realtime voice interaction, memory, action tools, and specialized sub-agents.

The project is built to move beyond a basic chatbot:

```text
        ┌───────────────────────────┐
        │           USER            │
        │    Voice / Text / UI      │
        └─────────────┬─────────────┘
                      │
                      ▼
        ┌───────────────────────────┐
        │      Nirmaraksh UI       │
        │        PyQt6 App          │
        └─────────────┬─────────────┘
                      │
                      ▼
        ┌───────────────────────────┐
        │    MAIN ORCHESTRATOR     │◄──── Memory
        │ Voice session + routing  │      Facts / Sessions
        └─────────────┬─────────────┘
                      │
                      ▼
        ┌───────────────────────────┐
        │      Gemini Live API      │
        │ Realtime voice + tools    │
        └─────────────┬─────────────┘
                      │
             ┌────────┴────────┐
             ▼                 ▼
      ┌──────────────┐  ┌──────────────┐
      │  TOOL LAYER  │  │  SUB-AGENTS  │
      │ 25+ actions  │  │ Research etc │
      └──────────────┘  └──────────────┘
```

---

# ✨ Features

| Capability | Description |
|---|---|
| 🎙️ **Realtime Voice** | Voice-first interaction through the Gemini Live API |
| 🖥️ **PyQt6 UI** | Desktop interface for interacting with the assistant |
| 🧠 **Memory** | Stores useful facts and session context |
| 🧰 **Tool Layer** | 25+ action tools for real-world workflows |
| 🤖 **Sub-agents** | Specialized agents for research, building, and multi-LLM workflows |
| 🔀 **Orchestration** | Central routing between sessions, tools, memory, and agents |
| 🔐 **Authentication** | Dedicated authentication and Supabase authentication modules |
| 🌐 **Multi-Model** | Designed to work with Gemini, Groq, Claude, and OpenAI |

---

# 🏗️ Architecture

## High-Level Flow

```text
                         ┌──────────────────────┐
                         │        USER          │
                         │ Voice / Text / UI    │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Nirmaraksh UI      │
                         │       PyQt6          │
                         └──────────┬───────────┘
                                    │
                                    ▼
              ┌────────────────────────────────────────┐
              │          MAIN ORCHESTRATOR             │
              │   Voice Session • Router • Context     │
              └───────────┬───────────────────┬────────┘
                          │                   │
                          │                   └──────────────┐
                          ▼                                  ▼
                 ┌────────────────┐                  ┌──────────────┐
                 │ Gemini Live API│                  │    Memory    │
                 │ Voice + Tools  │                  │ Facts/Session│
                 └───────┬────────┘                  └──────────────┘
                         │
                         ▼
              ┌────────────────────────────┐
              │       MODEL ROUTER         │
              │   Task-specific routing    │
              └───────┬────────┬───────────┘
                      │        │
          ┌───────────┘        │        └───────────────┐
          ▼                    ▼                        ▼
 ┌─────────────────┐  ┌─────────────────┐    ┌─────────────────┐
 │    OpenAI       │  │     Claude      │    │      Groq       │
 │    Sub-agents   │  │  Pentest / Sec  │    │    Fallback     │
 │ Research/Build  │  │ Security Tasks  │    │ Fast Inference  │
 └────────┬────────┘  └────────┬────────┘    └────────┬────────┘
          │                    │                      │
          └────────────────────┼──────────────────────┘
                               ▼
                  ┌─────────────────────────┐
                  │       TOOL LAYER        │
                  │       25+ actions       │
                  └─────────────────────────┘
```

### 🧩 Repository Structure

```text
Nirmaraksh-AI/
│
├── 📁 __pycache__/          # Python cache files
├── 📁 actions/              # Action / tool implementations
├── 📁 agents/               # AI agents and specialized workflows
├── 📁 assets/               # Images and project assets
├── 📁 config/               # Configuration and API credentials
├── 📁 core/                 # Main AI / orchestration logic
├── 📁 memory/               # Memory and session handling
│
├── 📄 .gitignore            # Git exclusions
├── 🐍 auth                  # Authentication entry/module
├── 🐍 main                  # Main application entry point
├── 📄 README.md             # Project documentation
├── 📄 requirements          # Python dependencies
├── 🐍 setup                 # Setup / initialization
├── 🐍 supabase_auth         # Supabase authentication
└── 🐍 ui                    # PyQt6 user interface
```

> **Note:** The structure above follows the repository layout provided for Nirmaraksh-AI. Keep generated cache directories such as `__pycache__/` out of version control.

---

# 🛠️ Installation

## 1. Clone

```bash
git clone https://github.com/Swarnabha07/Nirmaraksh-AI.git
cd Nirmaraksh-AI
```

## 2. Create a virtual environment

### Windows

```bash
python -m venv .venv
.venv\Scripts\activate
```

### Linux / macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
```

## 3. Install dependencies

If `requirements` is the project's dependency file:

```bash
pip install -r requirements
```

If it is named `requirements.txt` in the repository:

```bash
pip install -r requirements.txt
```

You can also install the package in editable mode when supported:

```bash
pip install -e .
```

---

# 🔑 API Key Configuration

Create:

```text
config/api_keys.json
```

Recommended structure:

```json
{
  "openai": "YOUR_OPENAI_API_KEY",
  "claude": "YOUR_ANTHROPIC_API_KEY",
  "groq": "YOUR_GROQ_API_KEY",
  "gemini": "YOUR_GOOGLE_GEMINI_API_KEY"
}
```

Replace the placeholders with your own provider credentials.

## 🔐 Protect your credentials

Never commit real API keys.

Recommended `.gitignore` entries:

```gitignore
config/api_keys.json
.env
.venv/
__pycache__/
*.pyc
```

If a key is exposed, revoke or rotate it immediately.

---

# ▶️ Running the Assistant

Start the main application with the project's entry point:

```bash
python main
```

Start the desktop UI directly when needed:

```bash
python ui
```

### ⚡ First-run flow

```text
╭──────────────────────────╮
│  01  Install Python      │
╰────────────┬─────────────╯
             ↓
╭──────────────────────────╮
│  02  Clone repository    │
╰────────────┬─────────────╯
             ↓
╭──────────────────────────╮
│  03  Create .venv        │
╰────────────┬─────────────╯
             ↓
╭──────────────────────────╮
│  04  Install dependencies│
╰────────────┬─────────────╯
             ↓
╭──────────────────────────╮
│  05  Add API keys        │
╰────────────┬─────────────╯
             ↓
╭──────────────────────────╮
│  06  Launch Nirmaraksh   │
╰────────────┬─────────────╯
             ↓
       ⚡ ONLINE
```

---

# 🧠 AI Provider Roles

| Provider | Intended Role |
|---|---|
| ✨ **Google Gemini** | Realtime voice interaction and tool calls |
| ⚡ **Groq** | Fast inference |
| 🛡️ **Anthropic Claude** | Security-oriented reasoning / specialized analysis |
| 🤖 **OpenAI** | Complex reasoning and sub-agent workflows |

Provider responsibilities can evolve as the project grows.

---

# 🧰 Core Components

### 🎙️ Nirmaraksh UI
The PyQt6 desktop application is the primary user-facing layer.

### 🧠 Main Orchestrator
The central coordination layer responsible for voice sessions, routing, and connecting the assistant to tools and other components.

### 💾 Memory
Stores facts and session context that can be used by the assistant.

### 🧰 Tool Layer
A collection of action tools that lets Nirmaraksh-AI perform tasks instead of only generating text.

### 🤖 Sub-agents
Specialized workflows such as research and builder-style agents, including multi-LLM workflows.

---

# 🔐 Security

Nirmaraksh-AI may communicate with external AI providers and other services.

### ✅ Do

- Keep API credentials local.
- Use separate development and production credentials.
- Rotate exposed keys.
- Keep authentication logic isolated.
- Keep secrets out of commits.

### ❌ Don't

- Commit `config/api_keys.json`.
- Put API keys in screenshots.
- Hard-code production credentials.
- Paste secrets into GitHub issues or pull requests.

---

# 🧪 Development

The project is designed to grow by adding new agents, actions, tools, and provider integrations without turning the core into a monolith.

A typical extension path:

```text
                 NEW CAPABILITY
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
          Agent                Action
             │                   │
             └─────────┬─────────┘
                       ▼
                 Core / Router
                       │
             ┌─────────┼─────────┐
             ▼         ▼         ▼
          Memory   AI Provider    UI
```

---

# 🤝 Contributing

Contributions are welcome.

Before opening a pull request:

1. Keep new functionality modular.
2. Never include secrets.
3. Test the affected workflow.
4. Update documentation for major features.
5. Add new agents/tools in their appropriate directories.
6. Keep the architecture diagram/documentation synchronized with major changes.

---

# 👥 Contributors

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=soft&color=0:00C6FF,100:7F00FF&height=90&section=header&text=The%20Builders&fontSize=30&fontColor=ffffff&animation=fadeIn" width="70%"/>
</p>

| Contributor | GitHub | Contribution |
|---|---|---|
| 👨‍💻 **Swarnabha Banerjee** | [@Swarnabha07](https://github.com/Swarnabha07) | Web Developer |
| 🧑‍💻 **Abhirup Sarkar** | [@abhi04anon](https://github.com/abhi04anon) | AI / ML / Agents |
| 🤖 **Rana Pratap Roy** | [@RP-Roy](https://github.com/RP-Roy) | Backend Developer |
| 🎨 **Snehasish Saha** | [@snehasishlabs](https://github.com/snehasishlabs) | UI / Design |

---

# ⭐ Support Nirmaraksh-AI

If you like the project:

```text
        ⭐ STAR
          │
          ▼
       🍴 FORK
          │
          ▼
      🧠 BUILD
          │
          ▼
      🤝 CONTRIBUTE
          │
          ▼
       🚀 SHARE
```

- ⭐ Star the repository
- 🍴 Fork it
- 🧠 Build a new agent
- 🧰 Add a useful action/tool
- 🐛 Report bugs
- 💡 Suggest ideas
- 🤝 Contribute

---

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:7F00FF,100:00C6FF&height=120&section=footer&animation=fadeIn" width="100%"/>
</p>

<p align="center">
  <b>⚡ Nirmaraksh-AI</b><br/>
  <i>Think. Understand. Act.</i>
</p>
