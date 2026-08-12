# NetScan 🌐

> A modern, sleek desktop network scanning and administration tool built with **Electron**, **React**, **TypeScript**, **Tailwind CSS**, and **Vite**.

![NetScan Banner](https://img.shields.io/badge/NetScan-v1.0.0-indigo?style=for-the-badge&logo=electron)
![Electron](https://img.shields.io/badge/Electron-30.0-47848F?style=for-the-badge&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## ✨ Features

- 🔍 **Subnet Device Discovery**: Scans local network segments using ARP table resolution and performs reverse DNS lookups to resolve hostnames and MAC addresses.
- ⚡ **Ping Diagnostics**: Test device connectivity, measuring round-trip latency, packet loss percentage, and timing statistics.
- 🔌 **TCP Port Scanner**: Scans common service ports (`21`, `22`, `23`, `25`, `53`, `80`, `110`, `135`, `139`, `143`, `443`, `445`, `3389`, `8080`) to identify open network ports.
- 🗺️ **Traceroute Mapping**: Track and visualize network hop routes to any selected target device on your local or remote network.
- ⏰ **Wake-on-LAN (WoL)**: Send Magic Packets over the network to remotely boot up supported devices using their physical MAC addresses.
- 🖥️ **Live Interactive Terminal**: Embedded CLI-style terminal window with real-time log streaming, glowing syntax output, auto-scroll capability, and terminal control.
- 🎨 **Dark Theme**: Modern UI designed with glowing accents, glassmorphism headers, and smooth micro-interactions.

---

## 🛠️ Technology Stack

- **Desktop Framework**: [Electron](https://www.electronjs.org/) (Main process with IPC handling, native child processes, and node-net integration)
- **Frontend UI**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Tooling**: [Vite](https://vitejs.dev/) with `vite-plugin-electron`
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/)
- **Packaging**: [Electron Builder](https://www.electron.build/) (NSIS Installer for Windows)

---

## 📁 Project Structure

```
NetScan/
├── electron/              # Electron main process & context bridge
│   ├── main.ts            # Application window management & IPC handlers
│   └── preload.ts         # Secure ContextBridge API exposure
├── src/                   # React renderer frontend
│   ├── App.tsx            # UI Layout, Device Panel, Action Cards & Terminal
│   ├── main.tsx           # React DOM root entrypoint
│   ├── index.css          # Tailwind CSS directives & scrollbar styling
│   └── types.d.ts         # TypeScript window & device definitions
├── public/                # Static assets
├── dist/                  # Compiled Vite output
├── dist-electron/         # Compiled main & preload scripts
├── release/               # Executable installer output (via electron-builder)
├── package.json           # Dependencies, scripts & build config
├── vite.config.ts         # Vite build settings & Electron integration
└── tailwind.config.js     # Custom Tailwind configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- Operating System: Windows, macOS, or Linux

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/chauhan739/NetScan.git
   cd NetScan
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

---

## 💻 Development & Usage

### Run in Development Mode

Launch the app with hot module reloading (HMR) for both the renderer and main process:

```bash
npm run dev
```

### Build for Production

Compile the TypeScript main process, bundle renderer assets with Vite, and generate the installer package via `electron-builder`:

```bash
npm run build
```

The output installer files will be located in the `release/` directory.

### Preview Build

Preview the production Vite build locally:

```bash
npm run preview
```

---

## 📖 Application Workflow

1. **Network Scan**: Click the **Scan** button in the left sidebar to execute an ARP network scan. Discovered devices appear in the list showing IP, MAC address, and resolved hostname.
2. **Device Selection**: Click on any target device in the list to open its control interface in the right pane.
3. **Running Utilities**:
   - **Ping Target**: Run ICMP ping tests to measure latency.
   - **Port Scan**: Scan target IP for standard TCP ports.
   - **Traceroute**: Trace hop-by-hop packet routes.
   - **Wake on LAN**: Send a magic packet to turn on the remote machine.
4. **Inspecting Output**: View real-time results in the built-in terminal window at the bottom of the screen.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
