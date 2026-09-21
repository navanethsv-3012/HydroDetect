import { MdMap } from 'react-icons/md';

/**
 * Factory Map — Placeholder Component
 *
 * TODO: Integrate with a maps API (Google Maps, Mapbox, or Leaflet) to show:
 * - Factory locations on an interactive map
 * - Device pins with real-time status indicators
 * - Click-to-drill-down into device details
 * - Geofencing for compliance zones
 *
 * Integration steps:
 * 1. Choose a maps provider (Leaflet recommended for open-source)
 * 2. Install: npm install react-leaflet leaflet
 * 3. Add map tiles and device markers
 * 4. Connect to device/reading data via props or API
 */
export default function FactoryMap() {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
          <MdMap className="text-emerald-600 text-lg" />
        </div>
        <h2 className="text-base font-semibold text-slate-800">Factory Map</h2>
      </div>

      <div className="rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center py-16">
        <MdMap className="text-5xl text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-500">Map Integration Coming Soon</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs text-center">
          This area will display an interactive map showing factory locations and device status.
          Requires Maps API integration (Leaflet / Google Maps).
        </p>
      </div>
    </div>
  );
}
