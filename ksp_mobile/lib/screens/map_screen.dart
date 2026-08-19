import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../main.dart';
import '../services/api_service.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({Key? key}) : super(key: key);

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  CrimeIncident? _selectedIncident;
  final MapController _mapController = MapController();

  Color _getMarkerColor(String majorHead) {
    switch (majorHead.toLowerCase()) {
      case 'cyber crime':
        return Colors.cyan;
      case 'narcotics':
        return Colors.pink;
      case 'theft':
        return Colors.amber;
      case 'assault':
        return Colors.red;
      default:
        return Colors.blue;
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = AppStateProvider.of(context);
    final incidents = appState.currentData?.cases ?? [];
    final patrolRoute = appState.currentData?.patrolRoute ?? [];

    // Setup map markers
    final List<Marker> markers = [];
    
    // Add Crime Hotspot markers
    for (var inc in incidents) {
      markers.add(
        Marker(
          point: LatLng(inc.latitude, inc.longitude),
          width: 32,
          height: 32,
          child: GestureDetector(
            onTap: () {
              setState(() {
                _selectedIncident = inc;
              });
            },
            child: Container(
              decoration: BoxDecoration(
                color: _getMarkerColor(inc.majorHead).withOpacity(0.2),
                shape: BoxShape.circle,
                border: Border.all(color: _getMarkerColor(inc.majorHead), width: 2),
              ),
              child: Center(
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: _getMarkerColor(inc.majorHead),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    }

    // Add Patrol Route Waypoint markers
    for (int i = 0; i < patrolRoute.length; i++) {
      final wp = patrolRoute[i];
      markers.add(
        Marker(
          point: LatLng(wp.latitude, wp.longitude),
          width: 20,
          height: 20,
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.green, width: 2),
            ),
            child: Center(
              child: Text(
                '${i + 1}',
                style: const TextStyle(fontSize: 8, color: Colors.black, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ),
      );
    }

    // Build Polyline points
    final List<LatLng> polylinePoints = patrolRoute
        .map((p) => LatLng(p.latitude, p.longitude))
        .toList();

    return Scaffold(
      body: Stack(
        children: [
          // 1. Flutter Map Layer
          FlutterMap(
            mapController: _mapController,
            options: const MapOptions(
              initialCenter: LatLng(12.9716, 77.5946), // default Bangalore
              initialZoom: 11.5,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                subdomains: const ['a', 'b', 'c', 'd'],
              ),
              if (polylinePoints.isNotEmpty)
                PolylineLayer(
                  polylines: [
                    // Glow effect
                    Polyline(
                      points: polylinePoints,
                      strokeWidth: 6.0,
                      color: Colors.green.withOpacity(0.3),
                    ),
                    // Main line
                    Polyline(
                      points: polylinePoints,
                      strokeWidth: 3.0,
                      color: Colors.green,
                    ),
                  ],
                ),
              MarkerLayer(markers: markers),
            ],
          ),

          // 2. Heatmap Legend HUD card
          Positioned(
            top: 10,
            left: 10,
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFF020617).withOpacity(0.85),
                border: Border.all(color: const Color(0xFF1E293B)),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildLegendRow('Cyber Crime', Colors.cyan),
                  _buildLegendRow('Narcotics', Colors.pink),
                  _buildLegendRow('Theft', Colors.amber),
                  _buildLegendRow('Assault', Colors.red),
                  if (polylinePoints.isNotEmpty) ...[
                    const Divider(color: Color(0xFF1E293B)),
                    Row(
                      children: [
                        Container(width: 14, height: 3, color: Colors.green),
                        const SizedBox(width: 8),
                        const Text('Patrol Beat Route', style: TextStyle(fontSize: 8, fontFamily: 'monospace')),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),

          // 3. Selected Marker Info Drawer
          if (_selectedIncident != null)
            Positioned(
              bottom: 12,
              left: 12,
              right: 12,
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  border: Border.all(color: Colors.cyan.withOpacity(0.3)),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.5),
                      blurRadius: 15,
                    )
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _selectedIncident!.crimeNo,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, fontFamily: 'monospace'),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                          decoration: BoxDecoration(
                            color: _getMarkerColor(_selectedIncident!.majorHead).withOpacity(0.15),
                            border: Border.all(color: _getMarkerColor(_selectedIncident!.majorHead).withOpacity(0.5)),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            _selectedIncident!.majorHead.toUpperCase(),
                            style: TextStyle(
                              fontFamily: 'monospace',
                              fontSize: 8,
                              fontWeight: FontWeight.bold,
                              color: _getMarkerColor(_selectedIncident!.majorHead),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Station Beat: ${_selectedIncident!.minorHead}',
                      style: const TextStyle(fontSize: 10, color: Colors.cyan, fontFamily: 'monospace'),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '"${_selectedIncident!.briefFacts}"',
                      style: const TextStyle(fontSize: 11, color: Color(0xFFCBD5E1), fontStyle: FontStyle.italic),
                    ),
                    const SizedBox(height: 10),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () {
                          setState(() {
                            _selectedIncident = null;
                          });
                        },
                        child: const Text('Close', style: TextStyle(color: Colors.grey, fontSize: 11)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildLegendRow(String title, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.0),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 8),
          Text(title, style: const TextStyle(fontSize: 8, fontFamily: 'monospace')),
        ],
      ),
    );
  }
}
