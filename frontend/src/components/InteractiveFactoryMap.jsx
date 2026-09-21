import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MdLocationOn } from 'react-icons/md';

// Custom Map Marker Icon Generator
const createCustomIcon = (status, isAnomaly) => {
  const color = isAnomaly ? '#EF4444' : status === 'online' ? '#10B981' : '#64748b';

  const svgHtml = `
    <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: ${color}; opacity: 0.15;"></div>
      <div style="width: 20px; height: 20px; border-radius: 50%; background: #ffffff; border: 2.5px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
        <div style="width: 7px; height: 7px; border-radius: 50%; background: ${color};"></div>
      </div>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const DEVICE_COORDINATES = {
  'ESP-DYE-001': { lat: 11.1085, lng: 77.3411, factory: 'HydroDetect Central Effluent Station' },
};

export default function InteractiveFactoryMap({ readings = [], devices = [] }) {
  const center = [11.1085, 77.3411];

  const mapNodes = (devices.length > 0 ? devices : Object.keys(DEVICE_COORDINATES).map(id => ({ deviceId: id, name: 'Main Effluent Monitoring Station' }))).map((dev) => {
    const coords = DEVICE_COORDINATES[dev.deviceId] || { lat: 11.1085, lng: 77.3411, factory: 'HydroDetect Station' };
    const latestReading = readings.find((r) => r.deviceId === dev.deviceId) || readings[0] || {};
    const isBypass = latestReading.water_loss_percent > 15;

    return {
      ...dev,
      lat: coords.lat,
      lng: coords.lng,
      factory: coords.factory,
      reading: latestReading,
      isBypass,
    };
  });

  return (
    <div className="glass-card p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#2DD4BF] flex-shrink-0">
            <MdLocationOn className="text-2xl" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-sans">
              Industrial Monitoring Station Map
              <span className="text-[11px] px-3 py-0.5 rounded-full bg-teal-50 text-[#2DD4BF] font-mono font-semibold border border-teal-200">LIVE GPS</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium font-sans">Real-time effluent monitoring station geolocation</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold font-sans">
          <div className="flex items-center gap-2 text-[#10B981]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            <span>Compliant</span>
          </div>
          <div className="flex items-center gap-2 text-[#EF4444]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-pulse" />
            <span>Bypass Alert</span>
          </div>
        </div>
      </div>

      <div className="h-[360px] w-full rounded-xl overflow-hidden relative border border-slate-200 shadow-xs">
        <MapContainer
          center={center}
          zoom={14}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {mapNodes.map((node) => {
            const icon = createCustomIcon(node.status || 'online', node.isBypass);

            return (
              <Marker
                key={node.deviceId}
                position={[node.lat, node.lng]}
                icon={icon}
              >
                <Popup>
                  <div className="p-1 min-w-[200px] font-sans">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                      <span className="font-semibold text-slate-900 text-xs">{node.name || node.deviceId}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${node.isBypass ? 'bg-red-50 text-[#EF4444] border-red-200' : 'bg-emerald-50 text-[#10B981] border-emerald-200'}`}>
                        {node.isBypass ? 'BYPASS' : 'COMPLIANT'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mb-2 font-mono">{node.factory}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="bg-slate-50 p-2 rounded-[10px] border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-sans font-semibold">pH Post</span>
                        <span className={`font-bold ${node.reading.ph_post < 6.5 || node.reading.ph_post > 8.5 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                          {node.reading.ph_post ?? '—'}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-[10px] border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-sans font-semibold">TDS Post</span>
                        <span className={`font-bold ${node.reading.tds_post > 500 ? 'text-[#EF4444]' : 'text-[#2DD4BF]'}`}>
                          {node.reading.tds_post ?? '—'} mg/L
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
