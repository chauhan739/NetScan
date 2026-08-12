import { useState, useRef, useEffect } from 'react';
import { Network, Activity, HardDrive, Zap, Route, Play, RefreshCw } from 'lucide-react';
import { Device } from './types';

function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [isRunningAction, setIsRunningAction] = useState(false);

  const terminalRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  const handleScanNetwork = async () => {
    setIsScanning(true);
    setDevices([]);
    setSelectedDevice(null);
    try {
      const result = await window.api.scanNetwork();
      const sortedResult = result.sort((a, b) => {
        const ipA = a.ip.split('.').map(Number);
        const ipB = b.ip.split('.').map(Number);
        for (let i = 0; i < 4; i++) {
          if (ipA[i] !== ipB[i]) return (ipA[i] || 0) - (ipB[i] || 0);
        }
        return 0;
      });
      setDevices(sortedResult);
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  const appendOutput = (data: string) => {
    setOutput((prev) => prev + data);
  };

  const runAction = async (action: 'ping' | 'port' | 'wake' | 'trace') => {
    if (!selectedDevice) return;
    setIsRunningAction(true);
    setOutput(`>>> Starting ${action} for ${selectedDevice.ip || selectedDevice.mac}...\n`);

    try {
      switch (action) {
        case 'ping':
          await window.api.pingDevice(selectedDevice.ip, appendOutput);
          break;
        case 'port':
          await window.api.scanPorts(selectedDevice.ip, appendOutput);
          break;
        case 'wake':
          await window.api.wakeDevice(selectedDevice.mac, appendOutput);
          break;
        case 'trace':
          await window.api.traceRoute(selectedDevice.ip, appendOutput);
          break;
      }
    } catch (err: any) {
      appendOutput(`\n[ERROR] ${err.message}\n`);
    } finally {
      setIsRunningAction(false);
      appendOutput(`\n>>> ${action} completed.\n`);
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans overflow-hidden">
      {/* Sidebar / Left Panel */}
      <div className="w-1/3 min-w-[300px] border-r border-gray-800 bg-gray-900 flex flex-col shadow-2xl z-10">
        <div className="p-5 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/30">
              <Network className="w-5 h-5 text-indigo-400" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">NetScan</h1>
          </div>
          <button
            onClick={handleScanNetwork}
            disabled={isScanning}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-indigo-900/20"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            Scan
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {isScanning && (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500/50" />
              <p className="text-sm font-medium animate-pulse">Scanning local subnet...</p>
            </div>
          )}

          {!isScanning && devices.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <HardDrive className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">No devices found. Run a scan to begin.</p>
            </div>
          )}

          {devices.map((device, idx) => (
            <div
              key={`${device.ip}-${idx}`}
              onClick={() => setSelectedDevice(device)}
              className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${selectedDevice?.ip === device.ip
                ? 'bg-indigo-600/10 border-indigo-500/50 shadow-inner'
                : 'bg-gray-800/40 border-gray-800 hover:bg-gray-800 hover:border-gray-700'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${device.status === 'online' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'}`} />
                  <span className="font-mono text-sm font-bold text-gray-200">{device.ip}</span>
                </div>
                <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">{device.mac}</span>
              </div>
              <div className="text-xs text-gray-400 font-medium truncate">
                {device.vendor || 'Unknown Host'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content / Right Panel */}
      <div className="flex-1 flex flex-col bg-[#0a0a0a]">
        {selectedDevice ? (
          <>
            {/* Header / Selected Device Info */}
            <div className="p-6 border-b border-gray-800/80 bg-gray-900/40">
              <h2 className="text-sm uppercase tracking-widest text-gray-500 font-semibold mb-1">Selected Target</h2>
              <div className="flex items-end gap-4">
                <span className="text-3xl font-mono font-bold text-gray-100 tracking-tight">{selectedDevice.ip}</span>
                <span className="text-base text-gray-400 font-mono pb-1">{selectedDevice.mac}</span>
              </div>
            </div>

            {/* Action Center Grid */}
            <div className="p-6 grid grid-cols-2 gap-4">
              <ActionCard
                icon={<Activity className="text-emerald-400" />}
                title="Ping Target"
                desc="Measure latency and packet loss"
                onClick={() => runAction('ping')}
                disabled={isRunningAction}
              />
              <ActionCard
                icon={<Zap className="text-amber-400" />}
                title="Port Scan"
                desc="Discover open TCP ports"
                onClick={() => runAction('port')}
                disabled={isRunningAction}
              />
              <ActionCard
                icon={<Route className="text-sky-400" />}
                title="Traceroute"
                desc="Map the network path"
                onClick={() => runAction('trace')}
                disabled={isRunningAction}
              />
              <ActionCard
                icon={<Play className="text-purple-400" />}
                title="Wake on LAN"
                desc="Send a magic packet"
                onClick={() => runAction('wake')}
                disabled={isRunningAction}
              />
            </div>

            {/* Terminal Output */}
            <div className="flex-1 flex flex-col px-6 pb-6 min-h-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Terminal Output</h3>
                {output && (
                  <button onClick={() => setOutput('')} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                    Clear
                  </button>
                )}
              </div>
              <div className="flex-1 bg-black rounded-xl border border-gray-800/50 shadow-2xl overflow-hidden relative group">
                <div className="absolute top-0 left-0 right-0 h-8 bg-gray-900/80 border-b border-gray-800 flex items-center px-4 gap-2 z-10">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                  <span className="ml-2 text-[10px] text-gray-500 font-mono tracking-widest">bash</span>
                </div>
                <pre
                  ref={terminalRef}
                  className="w-full h-full p-5 pt-12 text-sm font-mono text-emerald-400 overflow-y-auto whitespace-pre-wrap leading-relaxed custom-scrollbar"
                  style={{ textShadow: '0 0 5px rgba(52, 211, 153, 0.2)' }}
                >
                  {output || 'Waiting for action...'}
                </pre>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-gray-900 flex items-center justify-center border border-gray-800 shadow-xl">
              <Network className="w-10 h-10 text-gray-700" />
            </div>
            <p className="text-lg font-medium">Select a device to view actions</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionCard({ icon, title, desc, onClick, disabled }: { icon: React.ReactNode, title: string, desc: string, onClick: () => void, disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-start gap-4 p-5 rounded-xl bg-gray-900/50 border border-gray-800 hover:bg-gray-800/80 hover:border-gray-700 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-900/50 disabled:hover:border-gray-800 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
      <div className="p-3 bg-gray-950 rounded-lg shadow-inner group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h3 className="text-gray-200 font-semibold text-sm mb-1">{title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </button>
  )
}

export default App;
