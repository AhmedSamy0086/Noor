
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export class VoiceService {
  private recognition: any;
  private synth: SpeechSynthesis;
  private isListening: boolean = false;

  constructor() {
    this.synth = window.speechSynthesis;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    }
  }

  public speak(text: string) {
    // Cancel any current speech
    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    this.synth.speak(utterance);
  }

  public listen(onResult: (text: string) => void, onEnd: () => void) {
    if (!this.recognition || this.isListening) return;

    this.isListening = true;
    this.recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      onResult(text);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    this.recognition.start();
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}

export const voiceService = new VoiceService();
