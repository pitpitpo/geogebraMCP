# Multi-Platform Setup Guide for GeoGebra MCP (`gebrai`)

This guide provides end-to-end configuration and installation instructions to connect the **GeoGebra Model Context Protocol (MCP) server** to all major AI clients, IDEs, and agentic platforms across **macOS, Windows, and Linux**.

---

## ⚡ Quick Start: Automated Platform Setup

The repository includes an automated platform configuration utility that detects installed AI clients on your system and generates or merges the GeoGebra MCP configuration automatically:

```bash
# 1. Ensure project is built
npm run build

# 2. Check detection status on your system
node scripts/setup-platforms.js --status

# 3. Auto-install to all detected platforms
node scripts/setup-platforms.js --install-all

# Or install to a specific platform (e.g. claude, cursor, windsurf, cline, roocode, continue)
node scripts/setup-platforms.js --install cursor
```

To configure using `npx` (zero-install mode):
```bash
node scripts/setup-platforms.js --install claude --use-npx
```

---

## 📋 Platform Directory & File Locations

| Platform | macOS Path | Windows Path | Linux Path |
| :--- | :--- | :--- | :--- |
| **Claude Desktop** | `~/Library/Application Support/Claude/claude_desktop_config.json` | `%APPDATA%\Claude\claude_desktop_config.json` | `~/.config/Claude/claude_desktop_config.json` |
| **Cursor IDE (Global)** | `~/.cursor/mcp.json` | `%USERPROFILE%\.cursor\mcp.json` | `~/.cursor/mcp.json` |
| **Cursor (Workspace)** | `<project-root>/.cursor/mcp.json` | `<project-root>\.cursor\mcp.json` | `<project-root>/.cursor/mcp.json` |
| **Windsurf (Codeium)** | `~/.codeium/windsurf/mcp_config.json` | `%USERPROFILE%\.codeium\windsurf\mcp_config.json` | `~/.codeium/windsurf/mcp_config.json` |
| **VS Code (Cline)** | `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` | `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json` | `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` |
| **VS Code (Roo Code)** | `~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json` | `%APPDATA%\Code\User\globalStorage\rooveterinaryinc.roo-cline\settings\cline_mcp_settings.json` | `~/.config/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json` |
| **VS Code (Copilot)** | `<project-root>/.vscode/mcp.json` | `<project-root>\.vscode\mcp.json` | `<project-root>/.vscode/mcp.json` |
| **Continue.dev** | `~/.continue/config.json` | `%USERPROFILE%\.continue\config.json` | `~/.continue/config.json` |
| **JetBrains IDEs** | `~/Library/Application Support/JetBrains/<IDE>/mcp.json` | `%APPDATA%\JetBrains\<IDE>\mcp.json` | `~/.config/JetBrains/mcp.json` |
| **LibreChat** | `librechat.yaml` | `librechat.yaml` | `librechat.yaml` |
| **Docker** | Containerized stdio/HTTP | Containerized stdio/HTTP | Containerized stdio/HTTP |

---

## 1. 🟣 Claude Desktop

Claude Desktop provides native support for Model Context Protocol servers.

### Configuration (`claude_desktop_config.json`)

#### Option A: Local Build (Recommended for Development)
```json
{
  "mcpServers": {
    "geogebra": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/gebrai/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

#### Option B: NPX (No Local Build Required)
```json
{
  "mcpServers": {
    "geogebra": {
      "command": "npx",
      "args": [
        "-y",
        "@gebrai/gebrai"
      ],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

*Note: Restart Claude Desktop completely after modifying this file.*

---

## 2. ⚡ Cursor IDE

Cursor supports MCP tools across its Agent and Chat interfaces.

### Configuration (`~/.cursor/mcp.json` or `.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "geogebra": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/gebrai/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### In-Editor Setup:
1. Open Cursor Settings (`Ctrl+,` or `Cmd+,`).
2. Navigate to **Features** → **MCP**.
3. Confirm that `geogebra` shows a green status dot with 40 tools available.

---

## 3. 🌊 Windsurf (Codeium)

Windsurf supports MCP via Cascade.

### Configuration (`~/.codeium/windsurf/mcp_config.json`)

```json
{
  "mcpServers": {
    "geogebra": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/gebrai/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

---

## 4. 💻 VS Code Extensions

### A. Cline (`cline_mcp_settings.json`)

Cline allows setting automatic approval for trusted mathematical tools:

```json
{
  "mcpServers": {
    "geogebra": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/gebrai/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      },
      "disabled": false,
      "autoApprove": [
        "ping",
        "geogebra_create_point",
        "geogebra_create_line",
        "geogebra_create_circle",
        "geogebra_create_polygon",
        "geogebra_plot_function",
        "geogebra_export_png",
        "geogebra_export_svg",
        "geogebra_get_objects"
      ]
    }
  }
}
```

### B. Roo Code (`cline_mcp_settings.json`)

Same schema as Cline located in Roo Code's storage directory:
- Linux: `~/.config/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`
- macOS: `~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`
- Windows: `%APPDATA%\Code\User\globalStorage\rooveterinaryinc.roo-cline\settings\cline_mcp_settings.json`

### C. VS Code GitHub Copilot Chat (`.vscode/mcp.json`)

```json
{
  "mcpServers": {
    "geogebra": {
      "command": "node",
      "args": [
        "${workspaceFolder}/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

---

## 5. 🔄 Continue.dev

Continue uses an experimental `modelContextProtocolServers` array block inside `config.json`.

### Configuration (`~/.continue/config.json`)

```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "transport": {
          "type": "stdio",
          "command": "node",
          "args": [
            "/ABSOLUTE/PATH/TO/gebrai/dist/index.js"
          ],
          "env": {
            "NODE_ENV": "production",
            "LOG_LEVEL": "info"
          }
        }
      }
    ]
  }
}
```

---

## 6. 🧠 JetBrains IDEs (IntelliJ, PyCharm, WebStorm)

JetBrains AI Assistant supports MCP through standard project or user-level JSON configurations:

### Configuration (`mcp.json`)

```json
{
  "mcpServers": {
    "geogebra": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/gebrai/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

---

## 7. 💬 LibreChat

LibreChat integrates MCP servers via `librechat.yaml`.

### Configuration (`librechat.yaml`)

```yaml
version: 1.1.5

mcpServers:
  geogebra:
    type: stdio
    command: node
    args:
      - /ABSOLUTE/PATH/TO/gebrai/dist/index.js
    env:
      NODE_ENV: production
      LOG_LEVEL: info
    timeout: 30000
```

---

## 8. 🐳 Docker & Container Deployment

For self-hosted LLM frontends (e.g. Open WebUI, Ollama, remote agent hosts), use the pre-built Docker setup in `setups/docker/`.

### Run via Docker Compose:

```bash
cd setups/docker
docker compose up -d
```

### Manual Container Build & Run:

```bash
# Build image
docker build -t geogebra-mcp -f setups/docker/Dockerfile .

# Run interactively with stdio transport
docker run -i --rm geogebra-mcp
```

---

## 9. 🚀 Antigravity / T3 Code

In Antigravity / T3 Code workspaces, register `gebrai` in your `.mcp.json`:

```json
{
  "mcpServers": {
    "geogebra": {
      "command": "node",
      "args": [
        "/mnt/9f4d8733-a954-435d-b92f-f33c068c3b1e/Leafs/4/antigravity_env/home/.t3/scratch/2026-11-22-test-this-in-geogebra-https-00683002/gebrai/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

---

## 🖥️ Running Against Standalone GeoGebra App vs Headless Engine

By default, `gebrai` runs its embedded GeoGebra web engine headlessly via Puppeteer (`chrome-headless-shell`).

If you wish to view and interact with constructions inside the **Standalone Desktop GeoGebra Application** (Flatpak / Electron):

1. **Launch GeoGebra with Remote Debugging**:
   ```bash
   env -u ELECTRON_RUN_AS_NODE flatpak run org.geogebra.GeoGebra --remote-debugging-port=9222 --silent=false
   ```
2. Any client or automated script can connect via CDP WebSocket to `http://127.0.0.1:9222` to drive the desktop application live.

---

## 🔍 Verification & Health Check

After configuring your target platform, send this test prompt to your AI model:

> *"Use the GeoGebra MCP tool to plot $f(x) = \sin(x) \cdot x$ from $-10$ to $10$, create a point at the origin, and export a PNG visualization."*

### Expected Verification Sequence:
1. Model calls `geogebra_plot_function` with `expression: "sin(x) * x"`.
2. Model calls `geogebra_create_point` with `name: "O"`, `x: 0`, `y: 0`.
3. Model calls `geogebra_export_png` and receives base64 PNG data or file path.
4. Visualization renders successfully.
