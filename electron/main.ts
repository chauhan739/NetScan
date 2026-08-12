import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { exec } from 'node:child_process'
import dns from 'node:dns'
import net from 'node:net'
import ping from 'ping'
import wol from 'wake_on_lan'
import Traceroute from 'nodejs-traceroute'
import log from 'electron-log'

log.transports.file.level = 'info';
log.transports.console.level = 'info';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  log.info('Creating main window...');
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#030712',
      symbolColor: '#f3f4f6'
    }
  })

  // Vite sets VITE_DEV_SERVER_URL in dev
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Forward renderer console logs to terminal
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    const levels = ['debug', 'info', 'warn', 'error'];
    const logMethod = levels[level] || 'info';
    // @ts-ignore
    log[logMethod](`[Renderer] ${message} (${sourceId.split('/').pop()}:${line})`);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    log.info('Renderer process finished loading.');
  });

  mainWindow.on('closed', () => {
    log.info('Main window instance closed.');
  });
}

app.whenReady().then(() => {
  log.info('App is ready, initializing window...');
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  log.info('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers

ipcMain.handle('scan-network', async () => {
  log.info('Executing network scan (ARP)...');
  return new Promise((resolve) => {
    exec('arp -a', async (err, stdout) => {
      if (err) {
        log.error('ARP execution error:', err.message);
        resolve([]);
        return;
      }

      const lines = stdout.split('\n');
      const devices = [];
      const isWindows = process.platform === 'win32';

      for (const line of lines) {
        let ip = '', mac = '';
        if (isWindows) {
          // Windows format: "  192.168.1.1       00-11-22-33-44-55     dynamic"
          const match = line.match(/\s*([0-9\.]+)\s+([0-9a-f\-]+)\s+\w+/i);
          if (match) {
            ip = match[1];
            mac = match[2].replace(/-/g, ':');
          }
        } else {
          // Unix format: "? (192.168.1.1) at 00:11:22:33:44:55 on en0 ifscope [ethernet]"
          const match = line.match(/\(([0-9\.]+)\)\s+at\s+([0-9a-f:]+)/i);
          if (match) {
            ip = match[1];
            mac = match[2];
          }
        }

        if (ip && mac && mac !== 'ff:ff:ff:ff:ff:ff') {
          let hostname = undefined;
          try {
            const hostnames = await dns.promises.reverse(ip);
            if (hostnames.length > 0) hostname = hostnames[0];
          } catch (e: any) {
            log.warn(`Could not resolve hostname for ${ip}:`, e.message);
          }
          devices.push({ ip, mac, vendor: hostname, status: 'online' });
        }
      }
      log.info(`Network scan complete, found ${devices.length} devices.`);
      resolve(devices);
    });
  });
});

ipcMain.handle('ping-device', async (event, ip: string) => {
  log.info(`Initiated ping test for IP: ${ip}`);
  const channel = `ping-data-${ip}`;
  const send = (msg: string) => event.sender.send(channel, msg);
  
  send(`Pinging ${ip}...\n`);
  try {
    const extraArgs = process.platform === 'win32' ? ['-n', '4'] : ['-c', '4'];
    const res = await ping.promise.probe(ip, { timeout: 10, extra: extraArgs });
    send(`\n--- Ping Statistics for ${ip} ---\n`);
    send(`Status: ${res.alive ? 'Alive' : 'Dead'}\n`);
    send(`Packet Loss: ${res.packetLoss}%\n`);
    send(`Min/Avg/Max: ${res.min}/${res.avg}/${res.max} ms\n`);
    log.info(`Ping to ${ip} completed. Packet Loss: ${res.packetLoss}%`);
  } catch (err: any) {
    log.error(`Ping error for ${ip}:`, err.message);
    send(`Error: ${err.message}\n`);
  }
});

ipcMain.handle('scan-ports', async (event, ip: string) => {
  log.info(`Initiated port scan for IP: ${ip}`);
  const channel = `port-data-${ip}`;
  const send = (msg: string) => event.sender.send(channel, msg);
  
  const portsToScan = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 3389, 8080];
  send(`Scanning common ports on ${ip}...\n\n`);
  
  const openPorts = [];
  
  for (const port of portsToScan) {
    await new Promise<void>((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(2000);
      
      socket.on('connect', () => {
        send(`Port ${port}: OPEN\n`);
        openPorts.push(port);
        socket.destroy();
        resolve();
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        resolve();
      });
      
      socket.on('error', () => {
        socket.destroy();
        resolve();
      });
      
      socket.connect(port, ip);
    });
  }
  
  log.info(`Port scan for ${ip} complete. Found ${openPorts.length} open ports.`);
  send(`\nScan complete. Open ports: ${openPorts.length > 0 ? openPorts.join(', ') : 'None found'}\n`);
});

ipcMain.handle('wake-device', async (event, mac: string) => {
  log.info(`Initiated Wake-on-LAN for MAC: ${mac}`);
  const channel = `wake-data-${mac}`;
  const send = (msg: string) => event.sender.send(channel, msg);
  
  send(`Sending Magic Packet to ${mac}...\n`);
  return new Promise<void>((resolve) => {
    wol.wake(mac, (error: any) => {
      if (error) {
        log.error(`WOL error for ${mac}:`, error.message);
        send(`Error sending packet: ${error.message}\n`);
      } else {
        log.info(`WOL magic packet sent successfully to ${mac}`);
        send(`Magic Packet sent successfully.\n`);
      }
      resolve();
    });
  });
});

ipcMain.handle('trace-route', async (event, ip: string) => {
  log.info(`Initiated traceroute for IP: ${ip}`);
  const channel = `trace-data-${ip}`;
  const send = (msg: string) => event.sender.send(channel, msg);
  
  send(`Tracing route to ${ip}...\n\n`);
  
  return new Promise<void>((resolve) => {
    try {
      // @ts-ignore: nodejs-traceroute types do not export a constructable class properly
      const tracer = new Traceroute();
      tracer
        .on('pid', (pid) => {
          // console.log(`pid: ${pid}`);
        })
        .on('destination', (destination) => {
          send(`Destination: ${destination}\n`);
        })
        .on('hop', (hop) => {
          send(`${hop.hop}  ${hop.ip || '*'}  ${hop.rtt1 || '*'}  ${hop.rtt2 || '*'}  ${hop.rtt3 || '*'}\n`);
        })
        .on('close', (code) => {
          log.info(`Traceroute to ${ip} complete.`);
          send(`\nTrace complete.\n`);
          resolve();
        });

      tracer.trace(ip);
    } catch (ex: any) {
      log.error(`Traceroute error for ${ip}:`, ex.message);
      send(`Error: ${ex.message}\n`);
      resolve();
    }
  });
});
