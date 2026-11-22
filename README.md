# geogebraMCP

A Model Context Protocol (MCP) server that enables AI models to interact with GeoGebra's mathematical software suite for creating interactive mathematical visualizations and dynamic constructions.

[![CI - Multi-Platform Verification](https://github.com/pitpitpo/geogebraMCP/actions/workflows/ci.yml/badge.svg)](https://github.com/pitpitpo/geogebraMCP/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Overview

The GeoGebra MCP Tool bridges the gap between AI reasoning capabilities and mathematical visualization, allowing AI assistants to:

- Create geometric constructions (points, lines, circles, polygons)
- Plot mathematical functions and graphs
- Perform algebraic computations with visual representation
- Generate interactive mathematical demonstrations
- Export visualizations in various formats

## 🚀 Quick Start Examples

1. **NPX (Recommended)**:
```bash
# Start the server
npx @gebrai/gebrai

# Or with custom log level
npx @gebrai/gebrai --log-level debug
```

2. **Connect to Claude Desktop** - Add to your Claude configuration:
```json
{
  "mcpServers": {
    "geogebra": {
      "command": "npx",
      "args": ["@gebrai/gebrai"]
    }
  }
}
```

3. **Multi-Platform Support** - Claude Desktop, Cursor, Windsurf, VS Code (Cline/Roo Code/Copilot), Continue.dev, JetBrains, LibreChat, and Docker!
Check the [**Multi-Platform Setup Guide**](docs/guides/platform-setups.md) or run `npm run setup:platforms` for automated setup.

## 📦 Installation Options

### NPX (No Installation)
```bash
npx @gebrai/gebrai
```
✅ No installation required  
✅ Always uses latest version  
✅ Perfect for testing  

### Global Installation
```bash
npm install -g @gebrai/gebrai
```
✅ Faster startup after installation  
✅ Works offline  
✅ Consistent version  

### Local Development
```bash
git clone <repository-url>
cd gebrai && npm install
```
✅ Full source code access  
✅ Customization possible  
✅ Development workflow  

## 🛠️ CLI Usage

The GeoGebra MCP Tool provides a command-line interface with the following options:

```bash
Usage:
  npx @gebrai/gebrai [options]
  gebrai [options]              # if installed globally
  geogebra-mcp [options]        # alternative command

Options:
  -h, --help        Show help message
  -v, --version     Show version information
  --log-level LEVEL Set log level (error, warn, info, debug) [default: info]
  --port PORT       Set server port [default: stdin/stdout for MCP]

Examples:
  npx @gebrai/gebrai                    # Start MCP server
  npx @gebrai/gebrai --log-level debug  # Start with debug logging
  npx @gebrai/gebrai --help             # Show help
```

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd gebrai
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Start the server:
```bash
npm start
```

### Development Mode

For development with hot reload:

```bash
npm run dev
```

## 🛠️ Development

### Project Structure

```
gebrai/
├── src/
│   ├── index.ts          # Main entry point
│   ├── server.ts         # MCP server implementation
│   ├── types/
│   │   └── mcp.ts        # MCP protocol types
│   ├── tools/
│   │   └── index.ts      # Tool registry and example tools
│   └── utils/
│       ├── logger.ts     # Logging utility
│       └── errors.ts     # Error handling
├── tests/
│   ├── setup.ts          # Test configuration
│   └── server.test.ts    # Server tests
├── package.json
├── tsconfig.json
└── README.md
```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the TypeScript project
- `npm start` - Start the production server
- `npm test` - Run the test suite
- `npm run test:version` - Run GeoGebra version auto-detection & compatibility test suite
- `npm run test:compatibility` - Validate Gemini 2.5 Pro Preview schema compliance
- `npm run test:schema` - Validate Claude Sonnet 4 JSON Schema compliance
- `npm run test:all` - Run full compatibility test suite across all engines
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically

## 🔄 GeoGebra Version Auto-Detection & Universal Compatibility Engine

`geogebraMCP` features an integrated **GeoGebra Version Detection and Compatibility Engine** that auto-detects the running GeoGebra environment and provides dynamic polyfills and translations across all GeoGebra versions:

- **GeoGebra Classic 4** (v4.x legacy desktop / HTML5)
- **GeoGebra Classic 5** (v5.0.x / v5.2.x desktop and web)
- **GeoGebra Classic 6** (v6.0.0 – v6.0.699 desktop Electron / Flatpak / web)
- **GeoGebra Calculator Suite** (v6.0.700+ modern multi-app architecture)
- **GeoGebra Latest** (v6.0.850+ / v7.x flagship releases)

### Key Capabilities of the Version Engine:
1. **Dynamic Version & Generation Classification**: Automatically parses runtime versions and identifies the exact generation (`classic_4`, `classic_5`, `classic_6`, `modern_suite`, `latest`), app flavor (`classic`, `suite`, `graphing`, `geometry`, `3d`, `cas`, `notes`), and runtime environment (`puppeteer`, `standalone_cdp`, `mock`).
2. **Universal Export Multi-Fallback**:
   - Modern `exportImage({ type: 'png' | 'svg' | 'pdf' })` on Suite / v6.0.700+ / v7+.
   - Classic `getPNGBase64` and `exportSVG(callback)` / `getSVG()` on Classic 5/6.
   - Transparent DOM and canvas extraction fallbacks when applet methods are gated.
3. **Cross-Version Command Normalization**:
   - Perspective mapping (`algebra`/`graphing` ↔ `1`, `geometry` ↔ `2`, `cas` ↔ `5`, `3d` ↔ `6`).
   - Dimension-aware coordinate system bounds (automatically expands 2D bounds to 3D when 3D mode is active).
   - Slider syntax translation across 9-argument Classic and 3-argument Modern forms.
   - CAS preload and warmup lifecycle hooks for Classic 5/6.
4. **MCP Version Tool (`geogebra_detect_version`)**:
   - Call `geogebra_detect_version` to obtain complete runtime diagnostics, active adapters, and full generation compatibility reports.

### Testing

The project includes a comprehensive test suite using Jest:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📚 Documentation

For comprehensive documentation, visit our [**complete documentation**](docs/README.md) which includes:

### 📖 Core Documentation
- **[API Reference](docs/api/README.md)** - Complete tool documentation with examples
- **[Getting Started Guide](docs/guides/getting-started.md)** - Step-by-step setup and first usage
- **[Integration Guide](docs/guides/integration-guide.md)** - Platform integration instructions
- **[Troubleshooting](docs/support/troubleshooting.md)** - Common issues and solutions
- **[FAQ](docs/support/faq.md)** - Frequently asked questions

### 🔧 Tool Categories
- **[Basic Tools](docs/api/basic-tools.md)** - Core MCP functionality (ping, echo, server_info)
- **[GeoGebra Tools](docs/api/geogebra-tools.md)** - 25+ mathematical construction tools
- **[Educational Tools](docs/api/educational-tools.md)** - Pre-built educational templates
- **[Performance Tools](docs/api/performance-tools.md)** - Monitoring and optimization

### 🎓 Educational Resources
- **[Use Cases](docs/educational/use-cases.md)** - Real-world educational scenarios
- **[Teacher Guide](docs/educational/teacher-guide.md)** - Pedagogical guidance
- **[Classroom Examples](docs/educational/classroom-examples.md)** - Ready-to-use lessons

### 📝 Tutorials & Examples
- **[Basic Usage](docs/tutorials/basic-usage.md)** - Your first mathematical constructions
- **[Mathematical Constructions](docs/tutorials/mathematical-constructions.md)** - Geometry and algebra
- **[Function Plotting](docs/tutorials/function-plotting.md)** - Creating mathematical functions
- **[Code Examples](docs/examples/)** - Working examples by complexity

## 📊 Comprehensive Tool Suite (94 Tools)

`geogebraMCP` exposes **94 native MCP tools** enabling autonomous AI agents to utilize the complete mathematical, graphical, and computational power of GeoGebra:

| Category | Count | Focus Areas & Key Capabilities |
|----------|-------|--------------------------------|
| **Core GeoGebra & Calculus** | 25 tools | Points, lines, circles, polygons, functions, sliders, derivatives, integrals, animation |
| **Object Styling & Manipulation** | 13 tools | Deletion, coordinates, values, color/opacity, visibility, labels, captions, line/point styles, fixed state |
| **Canvas, Views & Viewport** | 9 tools | Coordinate system bounds, axes visibility, grid toggles, perspectives (algebra, 3D, CAS, geometry), zoom, pan, undo, redo, reset |
| **3D Geometry & Solid Modeling** | 5 tools | 3D points, spheres, planes, 3D parametric surfaces, polyhedra (cubes, prisms, pyramids, cylinders, cones) |
| **Advanced Calculus & Analysis** | 8 tools | Tangents, roots, extrema, inflection points, Taylor series polynomials, limits, asymptotes, definite integrals, area between curves, direction/slope fields |
| **Linear Algebra & Statistics** | 5 tools | Vectors (2D/3D), matrix operations (invert, determinant, eigenvalues, eigenvectors, RREF, rank, trace), curve fitting / regressions, descriptive statistics, probability distributions |
| **Geometric Transformations & Conics** | 5 tools | Rotation, reflection, translation, dilation/scaling, shears, conics (ellipse, hyperbola, parabola, 5-point conics), locus curves, angle measurement, multi-curve intersection |
| **State Serialization & Widgets** | 8 tools | XML construction state import/export, Base64 .ggb binary state import/export, batch command execution, interactive checkboxes, push buttons, input boxes |
| **Educational Templates** | 18 tools | Pre-configured interactive lesson templates, proofs, exploration scaffolds, pedagogical tools |
| **Performance & Diagnostics** | 3 tools | Pool health, pre-warming, latency benchmarks, memory metrics |
| **MCP Utility** | 3 tools | `ping`, `echo`, `server_info` |

### Key Agent Tool Highlights

- **Object Styling**: `geogebra_set_color`, `geogebra_set_line_style`, `geogebra_set_point_style`, `geogebra_set_coordinates`, `geogebra_set_caption`, `geogebra_set_fixed`
- **3D Solid Modeling**: `geogebra_create_3d_point`, `geogebra_create_sphere`, `geogebra_create_plane`, `geogebra_create_polyhedron`, `geogebra_surface_3d`
- **Calculus Analysis**: `geogebra_tangent_line`, `geogebra_extrema_and_roots`, `geogebra_taylor_polynomial`, `geogebra_limit`, `geogebra_asymptotes`, `geogebra_definite_integral`, `geogebra_integral_between`, `geogebra_direction_field`
- **Linear Algebra & Regressions**: `geogebra_create_vector`, `geogebra_matrix_operations`, `geogebra_fit_curve`, `geogebra_statistical_analysis`, `geogebra_probability_distribution`
- **Transformations & Conics**: `geogebra_transform_object`, `geogebra_create_conic`, `geogebra_locus`, `geogebra_measure_angle`, `geogebra_intersect_objects`
- **Persistence & Interactive UI**: `geogebra_get_xml`, `geogebra_set_xml`, `geogebra_get_base64`, `geogebra_set_base64`, `geogebra_batch_commands`, `geogebra_create_checkbox`, `geogebra_create_button`, `geogebra_create_input_box`

## 🔧 Configuration

### Environment Variables

- `PORT` - Server port (default: 3000)
- `LOG_LEVEL` - Logging level: error, warn, info, debug (default: info)
- `NODE_ENV` - Environment: development, production, test

### Example `.env` file

```env
PORT=3000
LOG_LEVEL=info
NODE_ENV=development
```

## 🏗️ Architecture

### Core Components

1. **MCP Server** (`src/server.ts`)
   - Handles JSON-RPC 2.0 protocol
   - Routes requests to appropriate handlers
   - Manages server lifecycle

2. **Tool Registry** (`src/tools/index.ts`)
   - Manages available tools
   - Handles tool execution
   - Provides tool discovery

3. **Error Handling** (`src/utils/errors.ts`)
   - Standardized error responses
   - JSON-RPC error codes
   - Comprehensive error logging

4. **Logging** (`src/utils/logger.ts`)
   - Structured logging with Winston
   - Configurable log levels
   - Development and production modes

### Design Principles

- **Type Safety**: Full TypeScript implementation with strict mode
- **Error Handling**: Comprehensive error handling and validation
- **Modularity**: Clean separation of concerns
- **Testability**: Extensive test coverage
- **Extensibility**: Easy to add new tools and features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-tool`
3. Make your changes and add tests
4. Ensure all tests pass: `npm test`
5. Commit your changes: `git commit -m 'Add new tool'`
6. Push to the branch: `git push origin feature/new-tool`
7. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Add tests for new functionality
- Update documentation as needed
- Use conventional commit messages
- Ensure code passes linting

## 🔗 Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [GeoGebra](https://www.geogebra.org/)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)

## 📞 Support

For questions, issues, or contributions, please:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue if needed
3. Join our community discussions

---
