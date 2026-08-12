export interface Device {
  ip: string;
  mac: string;
  vendor?: string;
  status: 'online' | 'offline' | 'unknown';
}

export interface NetworkAPI {
  scanNetwork: () => Promise<Device[]>;
  pingDevice: (ip: string, onData: (data: string) => void) => Promise<void>;
  scanPorts: (ip: string, onData: (data: string) => void) => Promise<void>;
  wakeDevice: (mac: string, onData: (data: string) => void) => Promise<void>;
  traceRoute: (ip: string, onData: (data: string) => void) => Promise<void>;
}

declare global {
  interface Window {
    api: NetworkAPI;
  }
}
