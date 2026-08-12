import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  scanNetwork: () => ipcRenderer.invoke('scan-network'),
  pingDevice: (ip: string, onData: (data: string) => void) => {
    const channel = `ping-data-${ip}`;
    const listener = (_event: any, data: string) => onData(data);
    ipcRenderer.on(channel, listener);
    return ipcRenderer.invoke('ping-device', ip).finally(() => {
      ipcRenderer.removeListener(channel, listener);
    });
  },
  scanPorts: (ip: string, onData: (data: string) => void) => {
    const channel = `port-data-${ip}`;
    const listener = (_event: any, data: string) => onData(data);
    ipcRenderer.on(channel, listener);
    return ipcRenderer.invoke('scan-ports', ip).finally(() => {
      ipcRenderer.removeListener(channel, listener);
    });
  },
  wakeDevice: (mac: string, onData: (data: string) => void) => {
    const channel = `wake-data-${mac}`;
    const listener = (_event: any, data: string) => onData(data);
    ipcRenderer.on(channel, listener);
    return ipcRenderer.invoke('wake-device', mac).finally(() => {
      ipcRenderer.removeListener(channel, listener);
    });
  },
  traceRoute: (ip: string, onData: (data: string) => void) => {
    const channel = `trace-data-${ip}`;
    const listener = (_event: any, data: string) => onData(data);
    ipcRenderer.on(channel, listener);
    return ipcRenderer.invoke('trace-route', ip).finally(() => {
      ipcRenderer.removeListener(channel, listener);
    });
  }
})
