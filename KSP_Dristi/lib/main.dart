import 'package:flutter/material.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'services/api_service.dart';

void main() {
  runApp(const KspIntelligenceApp());
}

// Global App State wrapper using InheritedWidget for stable state sharing
class AppStateProvider extends InheritedWidget {
  final KspIntelligenceState state;

  const AppStateProvider({
    Key? key,
    required this.state,
    required Widget child,
  }) : super(key: key, child: child);

  static KspIntelligenceState of(BuildContext context) {
    final AppStateProvider? result = context.dependOnInheritedWidgetOfExactType<AppStateProvider>();
    assert(result != null, 'No AppStateProvider found in context');
    return result!.state;
  }

  @override
  bool updateShouldNotify(AppStateProvider oldWidget) => true;
}

class KspIntelligenceApp extends StatefulWidget {
  const KspIntelligenceApp({Key? key}) : super(key: key);

  @override
  State<KspIntelligenceApp> createState() => KspIntelligenceState();
}

class KspIntelligenceState extends State<KspIntelligenceApp> {
  // Shared application state variables
  String activeRole = 'Investigator';
  List<ChatMessageModel> chatHistory = [];
  ApiResponse? currentData;
  bool isSyncing = false;

  void setRole(String newRole) {
    setState(() {
      activeRole = newRole;
    });
  }

  void addMessage(ChatMessageModel msg) {
    setState(() {
      chatHistory.add(msg);
    });
  }

  void updateResponseData(ApiResponse data) {
    setState(() {
      currentData = data;
    });
  }

  Future<void> syncDatabase(String query) async {
    setState(() {
      isSyncing = true;
    });
    try {
      final res = await ApiService.sendChatQuery(query, activeRole, chatHistory);
      setState(() {
        currentData = res;
      });
    } catch (e) {
      debugPrint('Sync failed: $e');
    } finally {
      setState(() {
        isSyncing = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppStateProvider(
      state: this,
      child: MaterialApp(
        title: 'KSP Command Mobile',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          brightness: Brightness.dark,
          scaffoldBackgroundColor: const Color(0xFF020617), // Slate-950
          primaryColor: Colors.cyan[500],
          cardColor: const Color(0xFF0F172A), // Slate-900
          dividerColor: const Color(0xFF1E293B),
          colorScheme: ColorScheme.dark(
            primary: Colors.cyan[500]!,
            secondary: Colors.blue[500]!,
            surface: const Color(0xFF0F172A),
            background: const Color(0xFF020617),
            error: Colors.red[600]!,
          ),
          textTheme: const TextTheme(
            titleMedium: TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold, fontSize: 16),
            bodyMedium: TextStyle(fontFamily: 'sans-serif', fontSize: 13, color: Color(0xFFCBD5E1)),
            labelSmall: TextStyle(fontFamily: 'monospace', color: Colors.grey, fontSize: 10),
          ),
          appBarTheme: const AppBarTheme(
            backgroundColor: Color(0xFF020617),
            elevation: 0,
            iconTheme: IconThemeData(color: Colors.cyan),
            titleTextStyle: TextStyle(
              fontFamily: 'monospace',
              fontSize: 16,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.5,
              color: Colors.white,
            ),
          ),
        ),
        home: const DashboardScreen(),
      ),
    );
  }
}
