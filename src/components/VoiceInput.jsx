import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Globe, Sparkles, AlertCircle, Check, Volume2, VolumeX, MessageSquare, Tag, Zap, RefreshCw, Send } from 'lucide-react';

export default function VoiceInput({ onTranscriptExtracted }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lang, setLang] = useState('hi-IN'); // 'hi-IN' | 'en-US' | 'mr-IN' | 'ta-IN' | 'bn-IN' | 'te-IN'
  const [recognition, setRecognition] = useState(null);
  const [supportError, setSupportError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const inputRef = useRef(null);

  // Multilingual Voice Samples Dictionary
  const sampleChipsByLang = {
    'hi-IN': [
      { label: '🎙️ "Haath par 1 hafte se khujli hai"', text: 'Mere haath par 1 hafte se khujli ho rahi hai' },
      { label: '🎙️ "Face par red rash aur jalan hai"', text: 'Face par red rash aur burning sensation hai 3 din se' },
      { label: '🎙️ "Legs par severe pain & dryness"', text: 'Legs par 2 weeks se dry skin aur severe pain hai' }
    ],
    'en-US': [
      { label: '🎙️ "Severe itching on hand for 1 week"', text: 'I have severe itching on my hand for 1 week' },
      { label: '🎙️ "Red rash and burning on face for 3 days"', text: 'Red rash and burning sensation on face for 3 days' },
      { label: '🎙️ "Severe pain & dryness on legs for 2 weeks"', text: 'Dry skin and severe pain on legs for 2 weeks' }
    ],
    'mr-IN': [
      { label: '🎙️ "हातावर १ आठवड्यापासून खाज सुटली आहे"', text: 'माझ्या हातावर १ आठवड्यापासून खूप खाज सुटली आहे' },
      { label: '🎙️ "चेहऱ्यावर लाल पुरळ आणि जळजळ आहे"', text: 'चेहऱ्यावर लाल पुरळ आणि ३ दिवसांपासून जळजळ होत आहे' },
      { label: '🎙️ "पायांवर २ आठवड्यांपासून वेदना व कोरडेपणा"', text: 'पायांवर २ आठवड्यांपासून खूप वेदना आणि कोरडेपणा आहे' }
    ],
    'ta-IN': [
      { label: '🎙️ "கையில் 1 வாரமாக அரிப்பு உள்ளது"', text: 'எனது கையில் 1 வாரமாக கடுமையான அரிப்பு உள்ளது' },
      { label: '🎙️ "முகத்தில் சிவந்த தடிப்பு மற்றும் எரிச்சல்"', text: 'முகத்தில் சிவந்த தடிப்பு மற்றும் 3 நாட்களாக எரிச்சல் உள்ளது' },
      { label: '🎙️ "கால்களில் 2 வாரமாக வலி மற்றும் வறட்சி"', text: 'கால்களில் 2 வாரமாக கடுமையான வலி மற்றும் வறட்சி உள்ளது' }
    ],
    'bn-IN': [
      { label: '🎙️ "হাতে ১ সপ্তাহ ধরে চুলকানি হচ্ছে"', text: 'আমার হাতে ১ সপ্তাহ ধরে ভীষণ চুলকানি হচ্ছে' },
      { label: '🎙️ "মুখে লাল ফুসকুড়ি এবং জ্বালা আছে"', text: 'মুখে লাল ফুসকুড়ি এবং ৩ দিন ধরে জ্বালা করছে' },
      { label: '🎙️ "পায়ে ২ সপ্তাহ ধরে তীব্র ব্যথা ও শুষ্কতা"', text: 'পায়ে ২ সপ্তাহ ধরে তীব্র ব্যথা এবং শুষ্কতা রয়েছে' }
    ],
    'te-IN': [
      { label: '🎙️ "చేతిపై 1 వారంగా దురదగా ఉంది"', text: 'నా చేతిపై 1 వారంగా తీవ్రమైన దురదగా ఉంది' },
      { label: '🎙️ "ముఖంపై ఎర్రటి మచ్చలు మరియు మంట"', text: 'ముఖంపై ఎర్రటి మచ్చలు మరియు 3 రోజులుగా మంటగా ఉంది' },
      { label: '🎙️ "కాళ్ళపై 2 వారాలుగా నొప్పి మరియు పొడిబారడం"', text: 'కాళ్ళపై 2 వారాలుగా తీవ్రమైన నొప్పి మరియు పొడిబారడం ఉంది' }
    ]
  };

  // Dynamic placeholders per language
  const placeholdersByLang = {
    'hi-IN': 'Tap mic button or type your symptoms here (Hindi / Hinglish)...',
    'en-US': 'Tap mic button or type your symptoms here in English...',
    'mr-IN': 'मायक्रोफोन टॅप करा किंवा लक्षणे टाइप करा (मराठी)...',
    'ta-IN': 'மைக் பட்டனை தட்டவும் அல்லது அறிகுறிகளை தட்டச்சு செய்யவும் (தமிழ்)...',
    'bn-IN': 'মাইক্রোফোন ট্যাপ করুন বা উপসর্গ লিখুন (বাংলা)...',
    'te-IN': 'మైక్ బటన్ నొక్కండి లేదా మీ లక్షణాలను టైప్ చేయండి (తెలుగు)...'
  };

  // Advanced NLP Multilingual Parser for Skin Symptoms
  const parseSymptomsNLP = (text) => {
    if (!text || !text.trim()) return null;
    const lower = text.toLowerCase();
    const extracted = {
      bodyLocation: null,
      itching: undefined,
      pain: undefined,
      burning: undefined,
      bleeding: undefined,
      scaling: undefined,
      duration: null,
      rawNote: text.trim()
    };

    // Body location detection (Hindi, Hinglish, Marathi, Tamil, Bengali, Telugu, English)
    if (/haath|hath|hand|arm|baju|finger|kandhe|shoulder|wrist|forearm|हात|हातावर|கை|கையில்|হাত|হাতে|చేతి|చేతిపై/.test(lower)) {
      extracted.bodyLocation = 'Arm / Hand';
    } else if (/pair|pao|paon|leg|foot|feet|tang|thigh|knee|ankle|पाय|पायांवर|கா|கால்களில்|পা|পায়ে|కాలు|కాళ్ళపై/.test(lower)) {
      extracted.bodyLocation = 'Leg / Foot';
    } else if (/chehra|face|gardan|head|sar|sir|muh|gal|forehead|chin|neck|चेहरा|चेहऱ्यावर|முகம்|முகத்தில்|মুখ|মুখে|ముఖం|ముఖంపై/.test(lower)) {
      extracted.bodyLocation = 'Face / Neck';
    } else if (/peth|piith|back|chest|chhati|pet|stomach|abdomen|torso|पाठ|छाती|முதுகு|বুক|వెన్ను/.test(lower)) {
      extracted.bodyLocation = 'Torso / Back / Chest';
    } else if (/scalp|baal|khopdi|डोके|தலை|মাথা|తల/.test(lower)) {
      extracted.bodyLocation = 'Scalp';
    } else if (/poore|widespread|multiple|body|sab jagah|सर्व|முழு|সব|అన్ని/.test(lower)) {
      extracted.bodyLocation = 'Widespread / Multiple Body Sites';
    }

    // Symptom indicators
    if (/khujli|khujal|khaj|itch|itching|pruritus|खाज|अरीप्पु|அரிப்பு|চুলকানি|দুর্দ|దురద/.test(lower)) extracted.itching = true;
    if (/dard|dukh|dukhana|pain|pida|sore|tenderness|painful|वेदना|दुखणे|வலி|ব্যথা|నొప్పి/.test(lower)) extracted.pain = true;
    if (/jalan|burn|burning|stinging|jhal|जळजळ|எரிச்சல்|জ্বালা|మంట/.test(lower)) extracted.burning = true;
    if (/khoon|bleed|bleeding|blood|ooz|रक्त|இரத்தம்|রক্ত|రక్తం/.test(lower)) extracted.bleeding = true;
    if (/sukhi|dry|dryness|papdi|scaling|chhil|flak|peel|rough|कोरडेपणा|வறட்சி|শুষ্কতা|పొడిబారడం/.test(lower)) extracted.scaling = true;

    // Duration extraction
    if (/48 ghante|48 hours|2 din|2 days|aaj|today|cal|yesterday|acute|२ दिवस|2 நாட்கள்|২ দিন|2 రోజులు/.test(lower)) {
      extracted.duration = 'Less than 48 hours';
    } else if (/3 din|4 din|5 din|few days|kuch din|3-7|३ दिवस|3 days|3 நாட்கள்|৩ দিন|3 రోజులు/.test(lower)) {
      extracted.duration = '3-7 days';
    } else if (/1 hafte|2 hafte|1 week|2 weeks|hafta|hafte|10 din|10 days|weeks|आठवडा|आठवड्यापासून|வாரமாக|সপ্তাহ|వారంగా|వారాలు|1 వారంగా|1 வாரமாக|১ সপ্তাহ|१ आठवड्यापासून/.test(lower)) {
      extracted.duration = '1-2 weeks';
    } else if (/mahina|mahine|month|months|1 month|2 month|3 month|महिना|மாதம்|মাস|నెల/.test(lower)) {
      extracted.duration = '1-3 months';
    } else if (/saal|year|years|chronic|purana|long time|वर्ष|ஆண்டு|বছর|సంవత్సరం/.test(lower)) {
      extracted.duration = 'Chronic (> 3 months)';
    }

    return extracted;
  };

  // Real-time extraction whenever transcript updates
  useEffect(() => {
    if (transcript.trim()) {
      const parsed = parseSymptomsNLP(transcript);
      setExtractedData(parsed);
    } else {
      setExtractedData(null);
    }
  }, [transcript]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupportError('Web Speech API is not natively supported in this browser. You can type or use sample presets below!');
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = lang;

      rec.onstart = () => {
        setIsListening(true);
        setSupportError(null);
      };

      rec.onresult = (event) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
      };

      rec.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSupportError('Microphone permission was denied. Please allow microphone access or type symptoms below.');
        } else if (event.error === 'no-speech') {
          setSupportError('No speech detected. Please tap mic and try speaking again.');
        } else if (event.error === 'network') {
          setSupportError('Network error connecting to speech recognition service.');
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    } catch (err) {
      console.error('Speech recognition init error:', err);
      setSupportError('Unable to initialize microphone. You can type symptoms below.');
    }
  }, [lang]);

  // Toggle Listening
  const toggleListening = () => {
    setSupportError(null);

    // If Web Speech API is missing, simulate voice listening demo
    if (!recognition) {
      simulateListening();
      return;
    }

    if (isListening) {
      try {
        recognition.stop();
      } catch (err) {
        console.warn('Stop speech error:', err);
      }
      setIsListening(false);
    } else {
      setTranscript('');
      try {
        recognition.lang = lang;
        recognition.start();
      } catch (err) {
        console.warn('Start speech error:', err);
        // Fallback to simulation if start fails (e.g. already started or blocked)
        simulateListening();
      }
    }
  };

  // Simulated Voice Input Fallback
  const simulateListening = () => {
    setIsListening(true);
    setIsSimulating(true);
    setTranscript('');
    
    const chips = sampleChipsByLang[lang] || sampleChipsByLang['hi-IN'];
    const sampleSentences = chips.map(chip => chip.text);
    const targetSentence = sampleSentences[Math.floor(Math.random() * sampleSentences.length)];
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= targetSentence.length) {
        setTranscript(targetSentence.slice(0, currentIndex));
        currentIndex += 2;
      } else {
        clearInterval(interval);
        setIsListening(false);
        setIsSimulating(false);
      }
    }, 60);
  };

  // Speak Parsed Symptoms using SpeechSynthesis (TTS)
  const speakFeedback = (textToSpeak) => {
    if (!('speechSynthesis' in window)) return;
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const parsed = parseSymptomsNLP(textToSpeak || transcript);
    if (!parsed) return;

    let speechText = `Extracted symptoms. `;
    if (parsed.bodyLocation) speechText += `Location: ${parsed.bodyLocation}. `;
    const symptomsList = [];
    if (parsed.itching) symptomsList.push('itching');
    if (parsed.pain) symptomsList.push('pain');
    if (parsed.burning) symptomsList.push('burning sensation');
    if (parsed.bleeding) symptomsList.push('bleeding');
    if (parsed.scaling) symptomsList.push('dry skin or scaling');
    if (symptomsList.length > 0) speechText += `Symptoms: ${symptomsList.join(', ')}. `;
    if (parsed.duration) speechText += `Duration: ${parsed.duration}.`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = lang === 'hi-IN' ? 'hi-IN' : (lang || 'en-US');
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Apply parsed voice data to form callback
  const handleApplyVoiceData = (textToApply) => {
    const text = textToApply !== undefined ? textToApply : transcript;
    const parsed = parseSymptomsNLP(text);
    if (parsed && onTranscriptExtracted) {
      onTranscriptExtracted(parsed);
    }
  };

  const currentSampleChips = sampleChipsByLang[lang] || sampleChipsByLang['hi-IN'];
  const currentPlaceholder = placeholdersByLang[lang] || placeholdersByLang['hi-IN'];

  return (
    <div className="w-full glass-card p-5 rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/95 via-slate-950 to-cyan-950/30 space-y-4 text-left shadow-[0_0_35px_rgba(6,182,212,0.15)] relative overflow-hidden transition-all">
      
      {/* Ambient background glow orb */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold border border-cyan-500/40 shadow-inner">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
              <span>Multilingual Voice AI Assistant</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                Hindi / English / Regional
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Speak or type symptoms naturally in Hindi, Hinglish or English.</p>
          </div>
        </div>

        {/* Language selector & Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300 shadow-inner">
            <Globe className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer text-xs"
            >
              <option value="hi-IN" className="bg-slate-900 text-slate-200">Hindi / Hinglish (हिन्दी)</option>
              <option value="en-US" className="bg-slate-900 text-slate-200">English (US)</option>
              <option value="mr-IN" className="bg-slate-900 text-slate-200">Marathi (मराठी)</option>
              <option value="ta-IN" className="bg-slate-900 text-slate-200">Tamil (தமிழ்)</option>
              <option value="bn-IN" className="bg-slate-900 text-slate-200">Bengali (বাংলা)</option>
              <option value="te-IN" className="bg-slate-900 text-slate-200">Telugu (తెలుగు)</option>
            </select>
          </div>

          {transcript && (
            <button
              type="button"
              onClick={() => speakFeedback()}
              className={`p-2 rounded-xl border transition-all ${
                isSpeaking 
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse' 
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-cyan-300'
              }`}
              title={isSpeaking ? "Stop AI Voice" : "Read Parsed Symptoms"}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Warning / Error Bar */}
      {supportError && (
        <div className="flex items-center justify-between gap-2 text-xs text-amber-300 bg-amber-950/60 p-3 rounded-2xl border border-amber-800/60 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{supportError}</span>
          </div>
          <button
            type="button"
            onClick={simulateListening}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold text-[11px] border border-amber-500/40 shrink-0 transition-all"
          >
            Try Mic Demo
          </button>
        </div>
      )}

      {/* Main Voice Mic & Interactive Input Container */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          
          {/* Microphone Button */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={toggleListening}
              className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-95 ${
                isListening
                  ? 'bg-rose-500 text-white shadow-[0_0_30px_rgba(244,63,94,0.7)] animate-pulse'
                  : 'bg-gradient-to-br from-cyan-400 to-teal-500 hover:from-cyan-300 hover:to-teal-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.35)]'
              }`}
              title={isListening ? 'Stop Listening' : 'Speak Symptoms'}
            >
              {isListening ? (
                <MicOff className="w-6 h-6 animate-spin-slow" />
              ) : (
                <Mic className="w-6 h-6 stroke-[2.5]" />
              )}
            </button>

            {isListening && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
              </span>
            )}
          </div>

          {/* Interactive Voice Text Box */}
          <div className="flex-1 min-h-[52px] bg-slate-950/90 px-4 py-2.5 rounded-2xl border border-slate-800 text-xs text-slate-200 flex items-center justify-between shadow-inner relative group focus-within:border-cyan-500/70 transition-colors">
            
            <input
              ref={inputRef}
              type="text"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={isListening ? "Listening... Speak your symptoms..." : currentPlaceholder}
              className="w-full bg-transparent text-cyan-200 font-mono text-xs placeholder:text-slate-500 focus:outline-none leading-relaxed pr-2"
            />

            {/* Equalizer Waveform Animation when Listening */}
            {isListening && (
              <div className="flex items-center gap-0.5 shrink-0 px-2">
                <span className="w-1 h-4 bg-rose-400 rounded-full animate-bounce"></span>
                <span className="w-1 h-6 bg-rose-500 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                <span className="w-1 h-3 bg-rose-400 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                <span className="w-1 h-5 bg-rose-500 rounded-full animate-bounce [animation-delay:0.45s]"></span>
              </div>
            )}

            {/* Clear Text button */}
            {transcript && !isListening && (
              <button
                type="button"
                onClick={() => setTranscript('')}
                className="text-slate-500 hover:text-slate-300 p-1 text-xs shrink-0"
                title="Clear transcript"
              >
                ✕
              </button>
            )}
          </div>

        </div>

        {/* Live NLP Extracted Entity Badges */}
        {extractedData && (extractedData.bodyLocation || extractedData.itching || extractedData.pain || extractedData.burning || extractedData.bleeding || extractedData.scaling || extractedData.duration) && (
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-cyan-500/20 space-y-2 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI Parsed Clinical Entities:</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" /> Live Extracted
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {extractedData.bodyLocation && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  📍 <span>Location: <b>{extractedData.bodyLocation}</b></span>
                </span>
              )}
              {extractedData.itching && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-teal-950 text-teal-300 border border-teal-500/30">
                  ✨ Itching
                </span>
              )}
              {extractedData.pain && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-rose-950 text-rose-300 border border-rose-500/30">
                  🔥 Pain
                </span>
              )}
              {extractedData.burning && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-amber-950 text-amber-300 border border-amber-500/30">
                  ⚡ Burning Sensation
                </span>
              )}
              {extractedData.bleeding && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-red-950 text-red-300 border border-red-500/30">
                  🩸 Bleeding / Oozing
                </span>
              )}
              {extractedData.scaling && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-blue-950 text-blue-300 border border-blue-500/30">
                  ❄️ Dry Skin / Scaling
                </span>
              )}
              {extractedData.duration && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-indigo-950 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  ⏱️ <span>Duration: <b>{extractedData.duration}</b></span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Row when transcript is available */}
        {transcript && (
          <div className="flex items-center justify-between pt-1 animate-in fade-in">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Symptoms ready. Click apply to auto-fill form below.
            </span>
            <button
              type="button"
              onClick={() => handleApplyVoiceData()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-teal-400/25 hover:scale-105 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Apply Voice Data to Form</span>
            </button>
          </div>
        )}

        {/* Quick Preset Voice Sample Chips */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-cyan-400" />
            <span>Or click a voice sample to test instant parsing:</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {currentSampleChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTranscript(chip.text);
                  handleApplyVoiceData(chip.text);
                }}
                className="text-[11px] font-medium px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-cyan-300 hover:text-white border border-slate-800 hover:border-cyan-500/40 transition-all hover:scale-102 text-left"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

