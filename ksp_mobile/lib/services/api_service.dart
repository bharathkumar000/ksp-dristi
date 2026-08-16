import 'dart:convert';
import 'package:http/http.dart' as http;
import 'dart:io' show Platform;

class PatrolPoint {
  final double latitude;
  final double longitude;
  final String beatName;

  PatrolPoint({
    required this.latitude,
    required this.longitude,
    required this.beatName,
  });

  factory PatrolPoint.fromJson(Map<String, dynamic> json) {
    return PatrolPoint(
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      beatName: json['Beat_Name'] ?? 'Waypoint',
    );
  }
}

class CrimeIncident {
  final String id;
  final String crimeNo;
  final String caseNo;
  final String majorHead;
  final String minorHead;
  final String briefFacts;
  final double latitude;
  final double longitude;
  final String date;

  CrimeIncident({
    required this.id,
    required this.crimeNo,
    required this.caseNo,
    required this.majorHead,
    required this.minorHead,
    required this.briefFacts,
    required this.latitude,
    required this.longitude,
    required this.date,
  });

  factory CrimeIncident.fromJson(Map<String, dynamic> json) {
    return CrimeIncident(
      id: json['CaseMasterID'] ?? '',
      crimeNo: json['CrimeNo'] ?? '',
      caseNo: json['CaseNo'] ?? '',
      majorHead: json['CrimeMajorHeadID'] ?? '',
      minorHead: json['CrimeMinorHeadID'] ?? '',
      briefFacts: json['BriefFacts'] ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 12.9716,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 77.5946,
      date: json['IncidentFromDate'] ?? '',
    );
  }
}

class AccusedOffender {
  final String id;
  final String name;
  final int age;
  final String gender;
  final String caseId;

  AccusedOffender({
    required this.id,
    required this.name,
    required this.age,
    required this.gender,
    required this.caseId,
  });

  factory AccusedOffender.fromJson(Map<String, dynamic> json) {
    return AccusedOffender(
      id: json['AccusedMasterID'] ?? '',
      name: json['AccusedName'] ?? '',
      age: json['AgeYear'] ?? 30,
      gender: json['GenderID'] ?? 'Male',
      caseId: json['CaseMasterID'] ?? '',
    );
  }
}

class ComplainantDemographic {
  final String id;
  final String name;
  final int age;
  final String occupation;
  final String religion;
  final String caste;
  final String gender;
  final String caseId;

  ComplainantDemographic({
    required this.id,
    required this.name,
    required this.age,
    required this.occupation,
    required this.religion,
    required this.caste,
    required this.gender,
    required this.caseId,
  });

  factory ComplainantDemographic.fromJson(Map<String, dynamic> json) {
    return ComplainantDemographic(
      id: json['ComplainantID'] ?? '',
      name: json['ComplainantName'] ?? '',
      age: json['AgeYear'] ?? 30,
      occupation: json['OccupationID'] ?? 'Business',
      religion: json['ReligionID'] ?? 'Hindu',
      caste: json['CasteID'] ?? 'General',
      gender: json['GenderID'] ?? 'Male',
      caseId: json['CaseMasterID'] ?? '',
    );
  }
}

class TransactionRecord {
  final String id;
  final String source;
  final String target;
  final double amount;
  final String timestamp;
  final String accusedId;
  final String caseId;
  final String suspectName;

  TransactionRecord({
    required this.id,
    required this.source,
    required this.target,
    required this.amount,
    required this.timestamp,
    required this.accusedId,
    required this.caseId,
    required this.suspectName,
  });

  factory TransactionRecord.fromJson(Map<String, dynamic> json) {
    return TransactionRecord(
      id: json['TransactionID'] ?? '',
      source: json['SourceAccount'] ?? '',
      target: json['TargetAccount'] ?? '',
      amount: (json['Amount'] as num?)?.toDouble() ?? 0.0,
      timestamp: json['Timestamp'] ?? '',
      accusedId: json['AccusedMasterID'] ?? '',
      caseId: json['CaseMasterID'] ?? '',
      suspectName: json['SuspectName'] ?? '',
    );
  }
}

class ChatMessageModel {
  final String id;
  final String sender;
  final String text;
  final String timestamp;
  final String? evidenceTrail;
  final List<String>? leads;

  ChatMessageModel({
    required this.id,
    required this.sender,
    required this.text,
    required this.timestamp,
    this.evidenceTrail,
    this.leads,
  });
}

class ApiResponse {
  final String text;
  final String queryUsed;
  final String evidenceTrail;
  final List<String> leads;
  final List<CrimeIncident> cases;
  final List<AccusedOffender> accused;
  final List<ComplainantDemographic> complainants;
  final List<TransactionRecord> transactions;
  final List<PatrolPoint> patrolRoute;

  ApiResponse({
    required this.text,
    required this.queryUsed,
    required this.evidenceTrail,
    required this.leads,
    required this.cases,
    required this.accused,
    required this.complainants,
    required this.transactions,
    required this.patrolRoute,
  });

  factory ApiResponse.fromJson(Map<String, dynamic> json) {
    final dbData = json['dbData'] as Map<String, dynamic>? ?? {};
    
    final List<CrimeIncident> parsedCases = [];
    if (dbData['cases'] != null) {
      for (var c in dbData['cases']) {
        parsedCases.add(CrimeIncident.fromJson(c));
      }
    }

    final List<AccusedOffender> parsedAccused = [];
    if (dbData['accused'] != null) {
      for (var a in dbData['accused']) {
        parsedAccused.add(AccusedOffender.fromJson(a));
      }
    }

    final List<ComplainantDemographic> parsedComps = [];
    if (dbData['complainants'] != null) {
      for (var comp in dbData['complainants']) {
        parsedComps.add(ComplainantDemographic.fromJson(comp));
      }
    }

    final List<TransactionRecord> parsedTxns = [];
    if (dbData['transactions'] != null) {
      for (var tx in dbData['transactions']) {
        parsedTxns.add(TransactionRecord.fromJson(tx));
      }
    }

    final List<PatrolPoint> parsedPatrol = [];
    if (json['patrolRoute'] != null) {
      for (var pt in json['patrolRoute']) {
        parsedPatrol.add(PatrolPoint.fromJson(pt));
      }
    }

    final List<String> parsedLeads = [];
    if (json['leads'] != null) {
      for (var ld in json['leads']) {
        parsedLeads.add(ld.toString());
      }
    }

    return ApiResponse(
      text: json['text'] ?? '',
      queryUsed: json['queryUsed'] ?? '',
      evidenceTrail: json['evidenceTrail'] ?? '',
      leads: parsedLeads,
      cases: parsedCases,
      accused: parsedAccused,
      complainants: parsedComps,
      transactions: parsedTxns,
      patrolRoute: parsedPatrol,
    );
  }
}

class ApiService {
  // Loopback connection depending on target hardware (10.0.2.2 resolves host machine localhost on Android emulator)
  static String get _hostBaseUrl {
    try {
      if (Platform.isAndroid) {
        return 'http://10.0.2.2:3000';
      }
    } catch (_) {}
    return 'http://localhost:3000';
  }

  static String apiEndpointUrl = '$_hostBaseUrl/api/chat';

  static Future<ApiResponse> sendChatQuery(
    String query,
    String role,
    List<ChatMessageModel> chatHistory, {
    String language = 'English',
  }) async {
    final List<Map<String, String>> historyList = [];
    
    // Map last 5 turns to prevent context bloat
    final recentHistory = chatHistory.length > 5 
        ? chatHistory.sublist(chatHistory.length - 5) 
        : chatHistory;
        
    for (var msg in recentHistory) {
      historyList.add({
        'sender': msg.sender,
        'text': msg.text,
      });
    }

    historyList.add({
      'sender': 'user',
      'text': query,
    });

    final response = await http.post(
      Uri.parse(apiEndpointUrl),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'messages': historyList,
        'role': role,
        'language': language,
      }),
    ).timeout(const Duration(seconds: 15));

    if (response.statusCode == 200) {
      final decodedJson = jsonDecode(response.body);
      return ApiResponse.fromJson(decodedJson);
    } else {
      throw HttpException('Server returned response code: ${response.statusCode}');
    }
  }
}

class HttpException implements Exception {
  final String message;
  HttpException(this.message);
  @override
  String toString() => message;
}
