
import React, { useState, useRef } from 'react';
import { ReportItem, PhotoAngle, PhotoData } from '../types';
import CameraModal from './CameraModal';

interface ItemCardProps {
  item: ReportItem;
  onUpdate: (updatedItem: ReportItem) => void;
  onRemove: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onUpdate, onRemove }) => {
  const [activeCamera, setActiveCamera] = useState<PhotoAngle | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingAngle, setPendingAngle] = useState<PhotoAngle | null>(null);

  const handlePhotoCapture = (angle: PhotoAngle, base64: string) => {
    const newPhotos = item.photos.map(p => p.angle === angle ? { ...p, base64 } : p);
    onUpdate({ ...item, photos: newPhotos });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && pendingAngle) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handlePhotoCapture(pendingAngle, reader.result as string);
        setPendingAngle(null);
        // Reset file input so same file can be selected again if needed
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerGallery = (angle: PhotoAngle) => {
    setPendingAngle(angle);
    fileInputRef.current?.click();
  };

  const isComplete = item.photos.every(p => p.base64 !== null) && item.name.length > 0;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-6">
      {/* Hidden file input - optimized for mobile to trigger native camera if preferred */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        capture="environment" // This triggers native camera app on many Android/iOS devices
        onChange={handleFileUpload}
      />

      <div className="flex justify-between items-start">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Denumire Bun / Item</label>
            <input
              type="text"
              value={item.name}
              onChange={(e) => onUpdate({ ...item, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
              placeholder="ex: Laptop Dell XPS"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Serie / Identificator</label>
            <input
              type="text"
              value={item.serialNumber}
              onChange={(e) => onUpdate({ ...item, serialNumber: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
              placeholder="ex: SN12345678"
            />
          </div>
        </div>
        <button 
          onClick={onRemove}
          className="ml-4 p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-75"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 text-center">Documentație Foto Obligatorie</label>
        <div className="grid grid-cols-2 gap-3">
          {item.photos.map((photo) => (
            <div key={photo.angle} className="space-y-2">
              <div className={`relative aspect-square w-full rounded-2xl border-2 flex flex-col items-center justify-center overflow-hidden transition-all bg-slate-50 ${
                  photo.base64 ? 'border-green-500 shadow-sm' : 'border-dashed border-slate-200'
                }`}>
                {photo.base64 ? (
                  <>
                    <img src={photo.base64} alt={photo.angle} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => handlePhotoCapture(photo.angle, null as any)}
                      className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full backdrop-blur-sm active:scale-75"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </>
                ) : (
                  <div className="text-center p-3">
                    <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">{photo.angle}</span>
                  </div>
                )}
                
                {/* Primary Action Button (Centered) */}
                <div className={`absolute inset-0 flex items-center justify-center gap-4 transition-all ${photo.base64 ? 'opacity-0 hover:opacity-100 bg-black/20' : ''}`}>
                  <button 
                    onClick={() => setActiveCamera(photo.angle)}
                    className="w-14 h-14 bg-blue-600 rounded-full shadow-2xl flex items-center justify-center text-white active:scale-75 transition-transform"
                    title="Cameră Live"
                  >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  
                  {/* Fallback to Gallery/Native Camera App if Live Camera fails */}
                  {!photo.base64 && (
                    <button 
                      onClick={() => triggerGallery(photo.angle)}
                      className="w-10 h-10 bg-white border border-slate-200 rounded-full shadow-xl flex items-center justify-center text-slate-600 active:scale-75 transition-transform"
                      title="Galerie / Cameră Nativă"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {activeCamera && (
        <CameraModal
          angle={activeCamera}
          onCapture={(base64) => handlePhotoCapture(activeCamera, base64)}
          onClose={() => setActiveCamera(null)}
        />
      )}

      {!isComplete && (
        <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 flex items-center gap-3">
           <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
           <p className="text-[10px] text-amber-800 font-bold leading-tight">
             Sunt necesare toate cele 4 fotografii pentru a finaliza raportul.
           </p>
        </div>
      )}
    </div>
  );
};

export default ItemCard;
