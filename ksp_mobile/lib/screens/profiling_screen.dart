import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'dart:math' as math;
import '../main.dart';
import '../services/api_service.dart';

class ProfilingScreen extends StatelessWidget {
  const ProfilingScreen({Key? key}) : super(key: key);

  List<Map<String, dynamic>> _calculateRecidivism(
    List<AccusedOffender> accused,
    List<ComplainantDemographic> complainants,
  ) {
    final Map<String, Map<String, dynamic>> counts = {};

    for (var acc in accused) {
      final name = acc.name;
      if (!counts.containsKey(name)) {
        counts[name] = {
          'count': 0,
          'age': acc.age,
          'gender': acc.gender,
          'id': acc.id,
        };
      }
      counts[name]!['count'] = (counts[name]!['count'] as int) + 1;
    }

    return counts.entries.map((entry) {
      final name = entry.key;
      final data = entry.value;
      final count = data['count'] as int;
      final age = data['age'] as int;
      final id = data['id'] as String;

      // Base recidivism algorithm
      int score = 0;
      if (count > 1) {
        score += 40 + (count - 2) * 20;
      } else {
        score += 15;
      }

      if (age >= 18 && age <= 30) {
        score += 10;
      }

      // Check for prior arrest surrogate
      if (id.startsWith('A_001') || id.startsWith('A_003')) {
        score += 15;
      }

      final riskScore = math.min(score, 95);
      String riskLevel;
      Color riskColor;
      if (riskScore > 70) {
        riskLevel = 'High';
        riskColor = Colors.red;
      } else if (riskScore > 40) {
        riskLevel = 'Moderate';
        riskColor = Colors.orange;
      } else {
        riskLevel = 'Low';
        riskColor = Colors.green;
      }

      return {
        'name': name,
        'count': count,
        'age': age,
        'gender': data['gender'],
        'riskScore': riskScore,
        'riskLevel': riskLevel,
        'riskColor': riskColor,
      };
    }).toList()
      ..sort((a, b) => (b['riskScore'] as int).compareTo(a['riskScore'] as int));
  }

  Map<String, int> _calculateDemographics(List<ComplainantDemographic> comps) {
    final Map<String, int> occupations = {};
    for (var c in comps) {
      final occ = c.occupation;
      occupations[occ] = (occupations[occ] ?? 0) + 1;
    }
    return occupations;
  }

  @override
  Widget build(BuildContext context) {
    final appState = AppStateProvider.of(context);
    final accused = appState.currentData?.accused ?? [];
    final complainants = appState.currentData?.complainants ?? [];

    final offenders = _calculateRecidivism(accused, complainants);
    final demographics = _calculateDemographics(complainants);

    return Scaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Section 1: Habitual Offenders
            const Row(
              children: [
                Icon(LucideIcons.shield_alert, color: Colors.orange, size: 16),
                SizedBox(width: 8),
                Text(
                  'HABITUAL CRIMINAL TRACKER',
                  style: TextStyle(fontFamily: 'monospace', fontSize: 10, color: Colors.grey, letterSpacing: 1.5),
                ),
              ],
            ),
            const SizedBox(height: 12),
            offenders.isEmpty
                ? const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 24.0),
                      child: Text('No offender indexes in search scope', style: TextStyle(fontSize: 10, color: Colors.grey)),
                    ),
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: offenders.length,
                    itemBuilder: (context, index) {
                      final off = offenders[index];
                      final score = off['riskScore'] as int;

                      return Card(
                        margin: const EdgeInsets.symmetric(vertical: 6),
                        color: const Color(0xFF0F172A),
                        shape: RoundedRectangleBorder(
                          side: BorderSide(color: const Color(0xFF1E293B), width: 1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    off['name'],
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                    decoration: BoxDecoration(
                                      color: (off['riskColor'] as Color).withOpacity(0.15),
                                      border: Border.all(color: off['riskColor']),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      '${off['riskLevel'].toUpperCase()} RISK',
                                      style: TextStyle(
                                        fontFamily: 'monospace',
                                        fontSize: 7.5,
                                        fontWeight: FontWeight.bold,
                                        color: off['riskColor'],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text('Arrests: ${off['count']}', style: const TextStyle(fontSize: 9.5, color: Colors.grey)),
                                    Text('Age/Sex: ${off['age']}y / ${off['gender']}', style: const TextStyle(fontSize: 9.5, color: Colors.grey)),
                                  ],
                              ),
                              const SizedBox(height: 10),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Recidivism Probability', style: TextStyle(fontSize: 8.5, color: Colors.grey)),
                                  Text('$score%', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: off['riskColor'])),
                                ],
                              ),
                              const SizedBox(height: 4),
                              LinearProgressIndicator(
                                value: score / 100.0,
                                backgroundColor: Colors.black.withOpacity(0.2),
                                valueColor: AlwaysStoppedAnimation<Color>(off['riskColor']),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
            const SizedBox(height: 28),

            // Section 2: Sociological bar scale charts
            const Row(
              children: [
                Icon(LucideIcons.activity, color: Colors.cyan, size: 16),
                SizedBox(width: 8),
                Text(
                  'SOCIOLOGICAL CRIME INSIGHTS',
                  style: TextStyle(fontFamily: 'monospace', fontSize: 10, color: Colors.grey, letterSpacing: 1.5),
                ),
              ],
            ),
            const SizedBox(height: 12),
            demographics.isEmpty
                ? const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 24.0),
                      child: Text('No complainant data active', style: TextStyle(fontSize: 10, color: Colors.grey)),
                    ),
                  )
                : Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      border: Border.all(color: const Color(0xFF1E293B)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Complainant Occupations:',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey),
                        ),
                        const SizedBox(height: 10),
                        ...demographics.entries.map((entry) {
                          final occ = entry.key;
                          final val = entry.value;
                          final pct = val / complainants.length;

                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(occ, style: const TextStyle(fontSize: 9.5)),
                                    Text('$val (${(pct * 100).toStringAsFixed(0)}%)', style: const TextStyle(fontSize: 9.5, color: Colors.cyan)),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Expanded(
                                      flex: (pct * 100).round(),
                                      child: Container(
                                        height: 5,
                                        decoration: BoxDecoration(
                                          color: Colors.cyan.withOpacity(0.8),
                                          borderRadius: BorderRadius.circular(3),
                                        ),
                                      ),
                                    ),
                                    Expanded(
                                      flex: (100 - pct * 100).round(),
                                      child: Container(),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          );
                        }),
                      ],
                    ),
                  ),
          ],
        ),
      ),
    );
  }
}
