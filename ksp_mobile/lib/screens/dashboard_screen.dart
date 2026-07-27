import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'dart:math' as math;
import '../main.dart';
import 'chat_screen.dart';
import 'map_screen.dart';
import 'profiling_screen.dart';
import '../services/api_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentTabIndex = 0;
  final TextEditingController _urlController = TextEditingController();

  final List<Widget> _tabs = [
    const OverviewTab(),
    const ChatScreen(),
    const MapScreen(),
    const ProfilingScreen(),
  ];

  final List<String> _titles = [
    'KSP DRISTI - DASHBOARD',
    'INTEL CHAT ASSISTANT',
    'TACTICAL MAP VIEW',
    'PROFILING MATRIX',
  ];

  @override
  void initState() {
    super.initState();
    _urlController.text = ApiService.apiEndpointUrl;
  }

  void _showSettingsDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF0F172A),
          title: const Text('API Connection Config', style: TextStyle(fontFamily: 'monospace', fontSize: 13)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Enter Next.js server api/chat URL:',
                style: TextStyle(fontSize: 10, color: Colors.grey),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _urlController,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  isDense: true,
                  hintText: 'http://localhost:3000/api/chat',
                ),
                style: const TextStyle(fontSize: 11, fontFamily: 'monospace'),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel', style: TextStyle(color: Colors.grey, fontSize: 11)),
            ),
            TextButton(
              onPressed: () {
                ApiService.apiEndpointUrl = _urlController.text.trim();
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Endpoint updated successfully')),
                );
              },
              child: const Text('Save', style: TextStyle(color: Colors.cyan, fontSize: 11)),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateProvider.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_titles[_currentTabIndex]),
            Text(
              'AUTH LEVEL: ${state.activeRole.toUpperCase()}',
              style: const TextStyle(fontSize: 7.5, color: Colors.cyan, fontFamily: 'monospace', letterSpacing: 1),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.settings, size: 18),
            onPressed: _showSettingsDialog,
          ),
        ],
      ),
      body: _tabs[_currentTabIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentTabIndex,
        type: BottomNavigationBarType.fixed,
        backgroundColor: const Color(0xFF090d1f),
        selectedItemColor: Colors.cyan[400],
        unselectedItemColor: Colors.grey[500],
        selectedFontSize: 9.5,
        unselectedFontSize: 9.5,
        iconSize: 18,
        items: [
          const BottomNavigationBarItem(
            icon: Icon(LucideIcons.layout_grid),
            label: 'Overview',
          ),
          const BottomNavigationBarItem(
            icon: Icon(LucideIcons.message_square),
            label: 'Chat Bot',
          ),
          const BottomNavigationBarItem(
            icon: Icon(LucideIcons.map),
            label: 'Map HUD',
          ),
          const BottomNavigationBarItem(
            icon: Icon(LucideIcons.shield_alert),
            label: 'Offenders',
          ),
        ],
        onTap: (index) {
          setState(() {
            _currentTabIndex = index;
          });
        },
      ),
    );
  }
}

// Separate widget for the Overview metrics tab
class OverviewTab extends StatelessWidget {
  const OverviewTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final state = AppStateProvider.of(context);
    final caseCount = state.currentData?.cases.length ?? 0;
    final accusedCount = state.currentData?.accused.length ?? 0;
    final txnCount = state.currentData?.transactions.length ?? 0;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Cybernetic Header Status block
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF0F172A), Color(0xFF090D1F)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              border: Border.all(color: Colors.cyan.withOpacity(0.2)),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'SYSTEM STATISTICS LOG',
                      style: TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 9,
                        color: Colors.grey,
                        letterSpacing: 1.2,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                      decoration: BoxDecoration(
                        color: Colors.green.withOpacity(0.1),
                        border: Border.all(color: Colors.green.withOpacity(0.5)),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'SYS_ACTIVE',
                        style: TextStyle(fontFamily: 'monospace', fontSize: 7, color: Colors.green, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildKpiMetric('ACTIVE CASES', '$caseCount', Colors.cyan),
                    _buildKpiMetric('ACCUSED TRACED', '$accusedCount', Colors.pink),
                    _buildKpiMetric('MONEY TRAILS', '$txnCount', Colors.green),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // 2. Role Selector Control
          const Text(
            'ACTIVE CONTROL PROFILE',
            style: TextStyle(fontFamily: 'monospace', fontSize: 9.5, color: Colors.grey, letterSpacing: 1.2),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              border: Border.all(color: const Color(0xFF1E293B)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: state.activeRole,
                isExpanded: true,
                icon: const Icon(LucideIcons.chevron_down, color: Colors.cyan, size: 16),
                style: const TextStyle(fontFamily: 'monospace', fontSize: 11.5, color: Colors.white),
                dropdownColor: const Color(0xFF0F172A),
                items: <String>['Investigator', 'Analyst', 'Supervisor', 'Policymaker']
                    .map((String value) {
                  return DropdownMenuItem<String>(
                    value: value,
                    child: Text('Authorized $value profile'),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null) state.setRole(val);
                },
              ),
            ),
          ),
          const SizedBox(height: 24),

          // 3. Tab Navigation Tip or Quick Search helper
          const Text(
            'DATALAKE CASE REGISTRY',
            style: TextStyle(fontFamily: 'monospace', fontSize: 9.5, color: Colors.grey, letterSpacing: 1.2),
          ),
          const SizedBox(height: 10),

          // List of incident summaries
          state.currentData == null
              ? const Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 30.0),
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.cyan),
                  ),
                )
              : ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: math.min(10, state.currentData!.cases.length),
                  itemBuilder: (context, idx) {
                    final c = state.currentData!.cases[idx];
                    return Card(
                      color: const Color(0xFF0F172A),
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      shape: RoundedRectangleBorder(
                        side: const BorderSide(color: Color(0xFF1E293B)),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: ListTile(
                        dense: true,
                        title: Text(
                          c.crimeNo,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, fontFamily: 'monospace'),
                        ),
                        subtitle: Text(
                          c.briefFacts,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 9.5, color: Colors.grey),
                        ),
                        trailing: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                          decoration: BoxDecoration(
                            color: Colors.cyan.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            c.majorHead.substring(0, math.min(8, c.majorHead.length)),
                            style: const TextStyle(fontSize: 8, color: Colors.cyan, fontFamily: 'monospace'),
                          ),
                        ),
                      ),
                    );
                  },
                ),
        ],
      ),
    );
  }

  Widget _buildKpiMetric(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 7.5, color: Colors.grey, fontFamily: 'monospace')),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
            color: color,
            shadows: [
              Shadow(
                blurRadius: 6,
                color: color.withOpacity(0.3),
              )
            ],
          ),
        ),
      ],
    );
  }
}
