import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import '../main.dart';
import '../services/api_service.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({Key? key}) : super(key: key);

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  
  late stt.SpeechToText _speech;
  bool _isListening = false;
  String _speechLang = 'en-IN'; // Default speech language
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _speech = stt.SpeechToText();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  // Multilingual Mobile Voice Recognition (Module 1)
  void _toggleVoiceListening() async {
    if (_isListening) {
      _speech.stop();
      setState(() => _isListening = false);
      return;
    }

    bool hasPermission = await _speech.initialize(
      onStatus: (status) => debugPrint('Voice Status: $status'),
      onError: (error) {
        debugPrint('Voice Error: $error');
        setState(() => _isListening = false);
      },
    );

    if (hasPermission) {
      setState(() => _isListening = true);
      
      String targetLocale = 'en_IN';
      if (_speechLang == 'hi-IN') {
        targetLocale = 'hi_IN';
      } else if (_speechLang == 'kn-IN') {
        targetLocale = 'kn_IN';
      }

      _speech.listen(
        localeId: targetLocale,
        onResult: (result) {
          setState(() {
            _textController.text = result.recognizedWords;
          });
          // Auto submit query on speech finalization
          if (result.finalResult) {
            setState(() => _isListening = false);
            _handleSendMessage();
          }
        },
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Microphone permissions denied')),
      );
    }
  }

  Future<void> _handleSendMessage() async {
    final text = _textController.text.trim();
    if (text.isEmpty) return;

    _textController.clear();
    final appState = AppStateProvider.of(context);

    final userMsg = ChatMessageModel(
      id: DateTime.now().toString(),
      sender: 'user',
      text: text,
      timestamp: TimeOfDay.now().format(context),
    );

    appState.addMessage(userMsg);
    _scrollToBottom();

    setState(() {
      _isLoading = true;
    });

    try {
      final langMapping = {
        'en-IN': 'English',
        'hi-IN': 'Hindi',
        'kn-IN': 'Kannada'
      };

      final res = await ApiService.sendChatQuery(
        text,
        appState.activeRole,
        appState.chatHistory,
        language: langMapping[_speechLang] ?? 'English',
      );

      final aiMsg = ChatMessageModel(
        id: DateTime.now().toString(),
        sender: 'ai',
        text: res.text,
        timestamp: TimeOfDay.now().format(context),
        evidenceTrail: res.evidenceTrail,
        leads: res.leads,
      );

      appState.addMessage(aiMsg);
      appState.updateResponseData(res);
      _scrollToBottom();
    } catch (e) {
      appState.addMessage(ChatMessageModel(
        id: DateTime.now().toString(),
        sender: 'ai',
        text: 'API Sync Offline. Tracing query local fallback indices: $e',
        timestamp: TimeOfDay.now().format(context),
      ));
      _scrollToBottom();
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Widget _buildLangChip(String code, String label) {
    final isSelected = _speechLang == code;
    return GestureDetector(
      onTap: () {
        setState(() {
          _speechLang = code;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? Colors.cyan.withOpacity(0.15) : Colors.transparent,
          border: Border.all(
            color: isSelected ? Colors.cyan : Colors.transparent,
          ),
          borderRadius: BorderRadius.circular(4),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.bold,
            color: isSelected ? Colors.cyan : Colors.grey,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final appState = AppStateProvider.of(context);

    return Scaffold(
      body: Column(
        children: [
          // Speech configuration header row
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'VOICE TRANSLATION LANG',
                  style: TextStyle(fontFamily: 'monospace', fontSize: 9, color: Colors.grey, letterSpacing: 1),
                ),
                Row(
                  children: [
                    Text(
                      _speechLang == 'en-IN' ? 'EN (INDIA)' : 'ಕನ್ನಡ (KN)',
                      style: const TextStyle(fontSize: 9.5, fontFamily: 'monospace', fontWeight: FontWeight.bold, color: Colors.cyan),
                    ),
                    Switch(
                      value: _speechLang == 'kn-IN',
                      activeThumbImage: null,
                      activeColor: Colors.cyan,
                      onChanged: (val) {
                        setState(() {
                          _speechLang = val ? 'kn-IN' : 'en-IN';
                        });
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFF1E293B)),
          // 1. Message logs scroll
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(12),
              itemCount: appState.chatHistory.length,
              itemBuilder: (context, index) {
                final msg = appState.chatHistory[index];
                final isUser = msg.sender == 'user';

                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.85),
                    margin: const EdgeInsets.symmetric(vertical: 6),
                    child: Column(
                      crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${isUser ? 'QUERY' : 'SYSTEM'} • ${msg.timestamp}',
                          style: const TextStyle(fontSize: 8, color: Colors.grey, fontFamily: 'monospace'),
                        ),
                        const SizedBox(height: 3),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isUser ? Colors.cyan[900] : const Color(0xFF0F172A),
                            border: Border.all(
                              color: isUser ? Colors.cyan[700]!.withOpacity(0.3) : const Color(0xFF1E293B),
                            ),
                            borderRadius: BorderRadius.only(
                              topLeft: const Radius.circular(12),
                              topRight: const Radius.circular(12),
                              bottomLeft: isUser ? const Radius.circular(12) : Radius.zero,
                              bottomRight: isUser ? Radius.zero : const Radius.circular(12),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                msg.text,
                                style: const TextStyle(fontSize: 12, height: 1.4),
                              ),
                              
                              // Display Actionable leads if present
                              if (msg.leads != null && msg.leads!.isNotEmpty) ...[
                                const SizedBox(height: 12),
                                const Divider(color: Color(0xFF1E293B)),
                                const Text(
                                  'TACTICAL LEADS:',
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontFamily: 'monospace',
                                    color: Colors.orange,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                ...msg.leads!.map(
                                  (lead) => Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 2.0),
                                    child: Text(
                                      '• $lead',
                                      style: const TextStyle(fontSize: 10, color: Colors.amber),
                                    ),
                                  ),
                                ),
                              ],

                              // Display query trail
                              if (msg.evidenceTrail != null && msg.evidenceTrail!.isNotEmpty) ...[
                                const SizedBox(height: 8),
                                Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withOpacity(0.3),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    'Trail: ${msg.evidenceTrail}',
                                    style: const TextStyle(fontSize: 8, color: Colors.grey, fontFamily: 'monospace'),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(8.0),
              child: SizedBox(
                height: 12,
                width: 12,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.cyan),
              ),
            ),

          // 2. Chat Input Console
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
            color: const Color(0xFF0F172A),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.only(bottom: 8.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'SELECT ACTIVE LANGUAGE:',
                        style: TextStyle(fontSize: 8, fontFamily: 'monospace', color: Colors.grey),
                      ),
                      Row(
                        children: [
                          _buildLangChip('en-IN', 'English'),
                          const SizedBox(width: 6),
                          _buildLangChip('hi-IN', 'Hindi'),
                          const SizedBox(width: 6),
                          _buildLangChip('kn-IN', 'Kannada'),
                        ],
                      ),
                    ],
                  ),
                ),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _textController,
                        decoration: InputDecoration(
                          hintText: 'Enter coordinates or ask beats...',
                          hintStyle: const TextStyle(color: Colors.grey, fontSize: 12),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(20),
                            borderSide: BorderSide.none,
                          ),
                          fillColor: const Color(0xFF020617),
                          filled: true,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          isDense: true,
                        ),
                        style: const TextStyle(fontSize: 12),
                        textInputAction: TextInputAction.send,
                        onSubmitted: (_) => _handleSendMessage(),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: Icon(
                        _isListening ? LucideIcons.mic_off : LucideIcons.mic,
                        color: _isListening ? Colors.pink : Colors.cyan,
                      ),
                      onPressed: _toggleVoiceListening,
                    ),
                    IconButton(
                      icon: const Icon(LucideIcons.send, color: Colors.cyan),
                      onPressed: _handleSendMessage,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
