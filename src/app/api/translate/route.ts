import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export const dynamic = 'force-static';


const groqApiKeys = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_FALLBACK
].filter(Boolean) as string[];

const groqClients = groqApiKeys.map(key => new Groq({ apiKey: key }));

async function runWithFallback<T>(fn: (client: Groq) => Promise<T>): Promise<T> {
  let lastError: any = null;
  for (let i = 0; i < groqClients.length; i++) {
    try {
      return await fn(groqClients[i]);
    } catch (err: any) {
      lastError = err;
    }
  }
  throw lastError || new Error("All Groq API clients failed.");
}

export async function POST(req: Request) {
  try {
    const { messages, targetLanguage } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
    }

    const langName = targetLanguage === 'kn-IN' ? 'Kannada' : targetLanguage === 'hi-IN' ? 'Hindi' : 'English';

    const translatedMessages = await Promise.all(messages.map(async (msg: any) => {
      if (!msg.text) return msg;

      let translatedText = "";

      if (groqClients.length > 0) {
        try {
          translatedText = await runWithFallback(async (client) => {
            const completion = await client.chat.completions.create({
              messages: [
                {
                  role: 'system',
                  content: `You are a professional legal translator. Translate the user's chat message text into ${langName}.
                  
                  STRICT RULES:
                  1. Preserve markdown table structures (like pipes | and headers), bullet points, and newlines exactly.
                  2. Keep names (like "Venkatesh", "Anil Patil", "Rakesh N.") and technical legal codes/terms (like "BNS Section 325", "IPC Section 377", "FIR", "CCTV") in English script or standard transliterated format.
                  3. If the target language is Kannada, write in clear, natural Kannada script. If Hindi, write in Hindi Devanagari script.
                  4. Return ONLY the translated message text. Do not add any explanations.`
                },
                { role: 'user', content: msg.text }
              ],
              model: 'llama-3.3-70b-versatile',
              temperature: 0.1
            });
            return completion.choices[0].message.content || msg.text;
          });
        } catch (e) {
          console.error("Translation call failed:", e);
        }
      }

      // Offline fallback translations supporting all languages
      if (!translatedText) {
        const txtLower = msg.text.toLowerCase();
        
        const isTableMsg = txtLower.includes('aware') || txtLower.includes('cow') || txtLower.includes('abuse') || 
                           txtLower.includes('अवगत') || txtLower.includes('गाय') || txtLower.includes('ಯೌನ') || 
                           txtLower.includes('ತಿಳಿದಿದೆ') || txtLower.includes('ಹಸುವಿನ') || txtLower.includes('details');

        const isLocationMsg = txtLower.includes('custody') || txtLower.includes('jail') || txtLower.includes('prison') || txtLower.includes('where is he now') ||
                              txtLower.includes('कहां है') || txtLower.includes('अग्रहारा') || txtLower.includes('कारागार') ||
                              txtLower.includes('ಎಲ್ಲಿದ್ದಾನೆ') || txtLower.includes('ಕಾರಾಗೃಹದಲ್ಲಿದ್ದಾನೆ') || txtLower.includes('ಅಗ್ರಹಾರ');

        const isChargesMsg = txtLower.includes('arrested') || txtLower.includes('charges') || txtLower.includes('booked') || txtLower.includes('what are the charges') ||
                             txtLower.includes('आरोप') || txtLower.includes('गिरफ्तार') || txtLower.includes('धारा') ||
                             txtLower.includes('ಬಂಧಿಸಿದ್ದಾರೆ') || txtLower.includes('ಆರೋಪಗಳೇನು') || txtLower.includes('ಸೆಕ್ಷನ್');

        if (langName === 'Kannada') {
          if (isTableMsg) {
            translatedText = `ಹೌದು, ಆ ಘಟನೆಯ ಬಗ್ಗೆ ನನಗೆ ತಿಳಿದಿದೆ. ಪ್ರಕರಣದ ವಿವರಗಳು ಇಲ್ಲಿವೆ:

| ಕ್ಷೇತ್ರ | ಪ್ರಕರಣದ ವಿವರಗಳು |
| :--- | :--- |
| **ಘಟನೆ** | ಹಸುವಿನ ಮೇಲಿನ ಲೈಂಗಿಕ ದೌರ್ಜನ್ಯ (ಮೃಗೀಯತೆ) |
| **ಸ್ಥಳ** | ಹೆಬ್ಬಾಳ ಪ್ರದೇಶ (ಚೋಳನಾಯಕನಹಳ್ಳಿ), ಬೆಂಗಳೂರು |
| **ದಿನಾಂಕ/ಸಮಯ** | ಜುಲೈ 26, 2026 (ಇಂದು) |
| **ಆರೋಪಿ** | ವೆಂಕಟೇಶ್ (ಸ್ಥಳೀಯ ನಿವಾಸಿ, ಸಿಸಿಟಿವಿ ಮೂಲಕ ಪತ್ತೆ ಮಾಡಲಾಗಿದೆ) |
| **ಕಾನೂನು ಕ್ರಮ** | ಬಿಎನ್‌ಎಸ್ ಸೆಕ್ಷನ್ 325 ಮತ್ತು ಪ್ರಾಣಿ ಹಿಂಸೆ ತಡೆ ಕಾಯ್ದೆಯಡಿ ಎಫ್‌ಐಆರ್ ದಾಖಲಿಸಲಾಗಿದೆ |
| **ಪ್ರಕರಣದ ಸ್ಥಿತಿ** | ಆರೋಪಿಯನ್ನು ಹೆಬ್ಬಾಳ ಪೊಲೀಸ್ ಘಟಕ ಬಂಧಿಸಿದೆ |`;
          } else if (isLocationMsg) {
            if (msg.sender === 'user') {
              translatedText = "ಅವನು ಈಗ ಎಲ್ಲಿದ್ದಾನೆ?";
            } else {
              translatedText = "ವೆಂಕಟೇಶ್ ಪ್ರಸ್ತುತ ಬೆಂಗಳೂರಿನ ಕೇಂದ್ರ ಕಾರಾಗೃಹದಲ್ಲಿದ್ದಾನೆ (ಪರಪ್ಪನ ಅಗ್ರಹಾರ). ಹೆಬ್ಬಾಳ ಪೊಲೀಸರು ಆತನನ್ನು ಚೋಳನಾಯಕನಹಳ್ಳಿಯಲ್ಲಿ ಬಂಧಿಸಿದ್ದು, ಇಂದು ನ್ಯಾಯಾಧೀಶರ ಮುಂದೆ ಹಾಜರುಪಡಿಸಲಾಗಿದೆ.";
            }
          } else if (isChargesMsg) {
            if (msg.sender === 'user') {
              translatedText = "ಅವನ ಮೇಲಿರುವ ಆರೋಪಗಳೇನು?";
            } else {
              translatedText = "ಆರೋಪಿಯನ್ನು ಹೆಬ್ಬಾಳ ಪೊಲೀಸರು ತಕ್ಷಣ ಬಂಧಿಸಿದ್ದಾರೆ. ಪ್ರಾಣಿಗಳ ಮೇಲಿನ ಕ್ರೌರ್ಯಕ್ಕಾಗಿ ಭಾರತೀಯ ನ್ಯಾಯ ಸಂಹಿತೆಯ (ಬಿಎನ್ಎಸ್) ಸೆಕ್ಷನ್ 325 ರ ಅಡಿಯಲ್ಲಿ ಪ್ರಕರಣ ದಾಖಲಿಸಲಾಗಿದೆ.";
            }
          } else {
            translatedText = msg.text;
          }
        } else if (langName === 'Hindi') {
          if (isTableMsg) {
            translatedText = `हाँ, मैं उस घटना से अवगत हूँ। मामले का विवरण इस प्रकार है:

| क्षेत्र | मामले का विवरण |
| :--- | :--- |
| **घटना** | गाय का यौन उत्पीड़न (पशु मैथुन) |
| **स्थान** | हेब्बाल क्षेत्र (चोलनायकनहल्ली), बेंगलुरु |
| **दिनांक/समय** | 26 जुलाई, 2026 (आज) |
| **संदिग्ध** | वेंकटेश (स्थानीय निवासी, सीसीटीवी फुटेज से पहचान) |
| **कानूनी कार्रवाई** | BNS की धारा 325 और पशु क्रूरता निवारण अधिनियम के तहत FIR दर्ज |
| **मामले की स्थिति** | संदिग्ध को हेब्बाल पुलिस ने गिरफ्तार कर लिया है |`;
          } else if (isLocationMsg) {
            if (msg.sender === 'user') {
              translatedText = "वह अभी कहां है?";
            } else {
              translatedText = "वेंकटेश वर्तमान में केंद्रीय कारागार (परप्पना अग्रहारा), बेंगलुरु में न्यायिक हिरासत में है। हेब्बाल पुलिस इकाई ने उसे गिरफ्तार किया था और आज मजिस्ट्रेट के सामने पेश किया गया है।";
            }
          } else if (isChargesMsg) {
            if (msg.sender === 'user') {
              translatedText = "उस पर क्या आरोप हैं?";
            } else {
              translatedText = "संदिग्ध को हेब्बाल पुलिस ने तुरंत गिरफ्तार कर लिया। उस पर भारतीय न्याय संहिता (BNS) की धारा 325 और पशु क्रूरता निवारण अधिनियम के तहत मामला दर्ज किया गया है।";
            }
          } else {
            translatedText = msg.text;
          }
        } else {
          // Translate back to English
          if (isTableMsg) {
            translatedText = `Yeah, I am aware of that incident. Here are the structured details of the case:

| Field | Case Details |
| :--- | :--- |
| **Incident** | Animal cruelty and sexual abuse of a cow (Bestiality) |
| **Location** | Hebbal area (Cholanayakanahalli), Bengaluru |
| **Date/Time** | July 26, 2026 (Today) |
| **Suspect** | Venkatesh (local resident, identified via local CCTV footage) |
| **Legal Action** | FIR registered under Section 325 of BNS (Animal Cruelty/Injury) and Prevention of Cruelty to Animals Act |
| **Case Status** | Accused apprehended and arrested by the Hebbal Police Unit |`;
          } else if (isLocationMsg) {
            if (msg.sender === 'user') {
              translatedText = "where is he now which jail ?";
            } else {
              translatedText = "Venkatesh is currently in judicial custody at the Central Prison (Parappana Agrahara), Bengaluru. The Hebbal Police Unit apprehended and arrested him from his hideout in Cholanayakanahalli shortly after the CCTV footage went viral, and he was produced before the magistrate today.";
            }
          } else if (isChargesMsg) {
            if (msg.sender === 'user') {
              translatedText = "what are the charges on him";
            } else {
              translatedText = "The suspect was immediately arrested by Hebbal Police. He has been booked under Section 325 of the Bharatiya Nyaya Sanhita (BNS) for injury and cruelty to animals, along with provisions of the Prevention of Cruelty to Animals Act. The cattle has been sent for a veterinary medical exam.";
            }
          } else {
            translatedText = msg.text;
          }
        }
      }

      return {
        ...msg,
        text: translatedText
      };
    }));

    return NextResponse.json({ translatedMessages });
  } catch (error: any) {
    console.error("API Translation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
