
import React from 'react';

interface Props {
  onUpload: (base64: string) => void;
  disabled: boolean;
}

const ImageUploader: React.FC<Props> = ({ onUpload, disabled }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      onUpload(base64String);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="relative group">
      <input
        type="file"
        id="tennis-upload"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />
      <label
        htmlFor="tennis-upload"
        className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl transition-all cursor-pointer 
          ${disabled 
            ? 'border-slate-800 bg-slate-900/50 cursor-not-allowed opacity-50' 
            : 'border-slate-700 bg-slate-900/30 hover:bg-slate-900/60 hover:border-[#00ff88]/50'
          }`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg className={`w-10 h-10 mb-4 ${disabled ? 'text-slate-600' : 'text-[#00ff88]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mb-2 text-lg text-slate-200 font-black">
            <span className="text-[#00ff88]">انقر لرفع</span> صورة ضربة التنس
          </p>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">JPG أو PNG (الحد الأقصى 5 ميجابايت)</p>
        </div>
      </label>
    </div>
  );
};

export default ImageUploader;
