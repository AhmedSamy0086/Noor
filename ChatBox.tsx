
import React, { useState } from 'react';

interface Props {
  onSend: (text: string) => void;
  disabled: boolean;
}

const ChatBox: React.FC<Props> = ({ onSend, disabled }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="اسأل المدرب: 'كيف أحسن التوب سبين؟' أو 'حلل وضعيتي المباشرة'"
        disabled={disabled}
        className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-[#00ff88]/50 text-slate-200 placeholder-slate-600 disabled:opacity-50 transition-all font-bold"
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="bg-[#00ff88] hover:bg-[#00e57a] disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black px-8 rounded-2xl transition-all shadow-[0_0_20px_rgba(0,255,136,0.2)] hover:shadow-[0_0_25px_rgba(0,255,136,0.4)]"
      >
        إرسال
      </button>
    </form>
  );
};

export default ChatBox;
