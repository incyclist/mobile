// Minimal jest mock for @maplibre/maplibre-react-native, mirroring the existing
// __mocks__/react-native-maps.tsx approach: each component becomes a bare host-component
// string, so tests can render the real FreeMapView.android.tsx and inspect the resulting
// tree (props like `id`/`lngLat`, and children) via UNSAFE_root/UNSAFE_getAllByProps,
// without pulling in the real native module.

const Map = 'Map';
const Camera = 'Camera';
const GeoJSONSource = 'GeoJSONSource';
const Layer = 'Layer';
const ViewAnnotation = 'ViewAnnotation';

const LogManager = { onLog: () => {} };
const NetworkManager = { setConnected: () => {} };

export { Map, Camera, GeoJSONSource, Layer, ViewAnnotation, LogManager, NetworkManager };
export default Map;
