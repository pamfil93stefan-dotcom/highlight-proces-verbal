import React, { useState, useEffect } from 'react';
import { ProcesVerbal, ReportItem, PhotoAngle } from './types';
import ItemCard from './components/ItemCard';
import SignaturePad from './components/SignaturePad';
import { polishReportObservations } from './services/geminiService';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const App: React.FC = () => {
  const [view, setView] = useState<'editor' | 'registry'>('editor');
  const [registry, setRegistry] = useState<ProcesVerbal[]>([]);
  const [includePhotos, setIncludePhotos] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [report, setReport] = useState<ProcesVerbal>({
    id: generateId(),
    title: '',
    date: new Date().toISOString().split('T')[0],
    createdAt: Date.now(),
    location: '',
    predator: '',
    primitor: '',
    participants: '',
    purpose: '',
    items: [],
    observations: '',
    signaturePredator: null,
    signaturePrimitor: null,
    status: 'draft'
  });

  const [isPolishing, setIsPolishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('reportero_registry_v2');
    if (saved) {
      try {
        setRegistry(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading registry", e);
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('Install prompt is ready');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('reportero_registry_v2', JSON.stringify(registry));
    } catch (e) {
      console.warn("Local storage full, could not save registry updates");
    }
  }, [registry]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const createNewReport = () => {
    if (report.title || report.items.length > 0) {
      if (!confirm("Sigur doriți să începeți un proces verbal nou?")) return;
    }
    setReport({
      id: generateId(),
      title: '',
      date: new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
      location: '',
      predator: '',
      primitor: '',
      participants: '',
      purpose: '',
      items: [],
      observations: '',
      signaturePredator: null,
      signaturePrimitor: null,
      status: 'draft'
    });
    setShowPreview(false);
    setView('editor');
  };

  const saveToRegistry = () => {
    const isComplete = 
      report.title && 
      report.items.length > 0 && 
      report.signaturePredator && 
      report.signaturePrimitor;

    const updatedReport: ProcesVerbal = { 
      ...report, 
      status: isComplete ? 'completed' : 'draft',
      createdAt: Date.now()
    };
    
    setRegistry(prev => {
      const exists = prev.find(r => r.id === report.id);
      if (exists) {
        return prev.map(r => r.id === report.id ? updatedReport : r);
      }
      return [updatedReport, ...prev];
    });
    
    alert("Salvat în arhivă!");
  };

  const loadFromRegistry = (r: ProcesVerbal) => {
    setReport(r);
    setView('editor');
    window.scrollTo(0,0);
  };

  const deleteFromRegistry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Ștergeți acest document?")) {
      setRegistry(prev => prev.filter(r => r.id !== id));
    }
  };

  const addItem = () => {
    const newItem: ReportItem = {
      id: generateId(),
      name: '',
      serialNumber: '',
      condition: 'Bun',
      photos: [
        { angle: PhotoAngle.FRONT, base64: null },
        { angle: PhotoAngle.BACK, base64: null },
        { angle: PhotoAngle.LEFT, base64: null },
        { angle: PhotoAngle.RIGHT, base64: null },
      ]
    };
    setReport(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const updateItem = (updatedItem: ReportItem) => {
    setReport(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === updatedItem.id ? updatedItem : item)
    }));
  };

  const removeItem = (id: string) => {
    setReport(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const handlePolish = async () => {
    if (!report.observations) return;
    setIsPolishing(true);
    const polished = await polishReportObservations(report.observations);
    setReport(prev => ({ ...prev, observations: polished }));
    setIsPolishing(false);
  };

  const handlePrint = (withPhotos: boolean) => {
    setIncludePhotos(withPhotos);
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
      }, 300);
    });
  };

  const canFinalize = 
    report.title && 
    report.items.length > 0 && 
    report.items.every(item => item.name && item.photos.every(p => p.base64)) &&
    report.signaturePredator &&
    report.signaturePrimitor;

  if (showPreview) {
    return (
      <div className={`min-h-screen bg-white p-4 md:p-12 safe-top print-container ${!includePhotos ? 'no-print-photos' : ''}`}>
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-center border-b pb-8 gap-4 print:hidden">
            <button 
              onClick={() => setShowPreview(false)}
              className="w-full sm:w-auto px-8 py-5 text-slate-800 flex items-center justify-center gap-3 bg-slate-100 rounded-2xl active:scale-95 transition-all font-bold text-base border border-slate-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Editare
            </button>
            <div className="flex gap-4 w-full sm:w-auto">
              <button 
                onClick={() => handlePrint(false)}
                className="flex-1 sm:flex-none px-8 py-5 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg"
              >
                Sinteză
              </button>
              <button 
                onClick={() => handlePrint(true)}
                className="flex-1 sm:flex-none px-8 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-blue-500/20"
              >
                Raport Foto
              </button>
            </div>
          </div>

          <div className="text-center space-y-4">
            <h1 className="text-3xl font-black uppercase tracking-tighter border-b-8 border-slate-900 pb-4 inline-block">Proces Verbal</h1>
            <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">Referință Sistem: {report.id.substring(0, 8)}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-base border-4 border-slate-900/5 p-10 rounded-[40px] bg-slate-50/50">
            <div className="col-span-2 sm:col-span-1"><p className="text-slate-400 uppercase font-black text-[10px] mb-2 tracking-widest">Obiectul Tranzacției</p><p className="font-black text-slate-900 text-xl leading-tight">{report.title}</p></div>
            <div className="col-span-2 sm:col-span-1"><p className="text-slate-400 uppercase font-black text-[10px] mb-2 tracking-widest">Data Document</p><p className="font-black text-slate-900 text-xl">{report.date}</p></div>
            <div className="col-span-2 h-px bg-slate-200 my-2"></div>
            <div><p className="text-slate-400 uppercase font-black text-[10px] mb-2 tracking-widest">Locație</p><p className="font-bold text-slate-800">{report.location || 'Nespecificat'}</p></div>
            <div><p className="text-slate-400 uppercase font-black text-[10px] mb-2 tracking-widest">Status</p><p className="font-bold text-blue-600 uppercase tracking-tighter">{report.status}</p></div>
            <div className="col-span-2 h-px bg-slate-200 my-2"></div>
            <div><p className="text-slate-400 uppercase font-black text-[10px] mb-2 tracking-widest">Am Predat (Nume)</p><p className="font-black text-slate-900 uppercase text-lg">{report.predator || '-'}</p></div>
            <div><p className="text-slate-400 uppercase font-black text-[10px] mb-2 tracking-widest">Am Primit (Nume)</p><p className="font-black text-slate-900 uppercase text-lg">{report.primitor || '-'}</p></div>
          </div>

          <div className="space-y-12">
            <h3 className="font-black border-l-8 border-blue-600 pl-6 uppercase text-sm tracking-widest text-slate-900">Bunuri și Obiecte Inspectate</h3>
            {report.items.map((item, idx) => (
              <div key={item.id} className="border-2 border-slate-100 rounded-[40px] p-8 space-y-6 break-inside-avoid shadow-sm bg-white">
                <div className="flex flex-col sm:flex-row justify-between sm:items-baseline gap-4">
                  <span className="text-2xl font-black text-slate-900">{idx + 1}. {item.name}</span>
                  <span className="text-slate-600 text-xs font-black bg-slate-100 px-5 py-2 rounded-2xl uppercase tracking-widest self-start">SN: {item.serialNumber || 'Lipsă'}</span>
                </div>
                
                <div className={`photo-grid grid grid-cols-2 sm:grid-cols-4 gap-6 ${!includePhotos ? 'hidden' : ''}`}>
                  {item.photos.map(p => (
                    <div key={p.angle} className="space-y-3">
                      <div className="aspect-square bg-slate-50 rounded-3xl overflow-hidden border-2 border-slate-100 shadow-inner">
                        {p.base64 && <img src={p.base64} className="w-full h-full object-cover" alt={p.angle} />}
                      </div>
                      <p className="text-[10px] text-center text-slate-400 font-black uppercase tracking-widest">{p.angle}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6 break-inside-avoid">
            <h3 className="font-black border-l-8 border-blue-600 pl-6 uppercase text-sm tracking-widest text-slate-900">Observații Finale</h3>
            <div className="p-10 bg-slate-50 border-2 border-slate-100 rounded-[40px] text-base leading-relaxed italic text-slate-900 whitespace-pre-wrap shadow-inner">
              {report.observations || "Fără observații suplimentare. Bunurile au fost verificate și corespund descrierii."}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-16 pt-32 pb-24 break-inside-avoid">
            <div className="text-center space-y-6">
              {report.signaturePredator && (
                <div className="flex justify-center h-32">
                  <img src={report.signaturePredator} className="h-full object-contain" alt="Semnătură Predător" />
                </div>
              )}
              <div className="border-t-4 border-slate-900 pt-5">
                <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-slate-500">Semnătură Predător</p>
                <p className="font-black text-slate-900 uppercase text-lg">{report.predator}</p>
              </div>
            </div>
            <div className="text-center space-y-6">
              {report.signaturePrimitor && (
                <div className="flex justify-center h-32">
                  <img src={report.signaturePrimitor} className="h-full object-contain" alt="Semnătură Primitor" />
                </div>
              )}
              <div className="border-t-4 border-slate-900 pt-5">
                <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-slate-500">Semnătură Primitor</p>
                <p className="font-black text-slate-900 uppercase text-lg">{report.primitor}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white/95 backdrop-blur-3xl border-b border-slate-200 sticky top-0 z-50 safe-top">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-[20px] flex items-center justify-center shadow-xl shadow-blue-600/30">
              <span className="text-white font-black text-2xl tracking-tighter">R</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">Reportero</h1>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Proces Verbal v2.2</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {deferredPrompt && (
              <button 
                onClick={handleInstallClick}
                className="bg-blue-600 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Instalează
              </button>
            )}
            <nav className="flex bg-slate-100 p-1.5 sm:p-2 rounded-2xl border border-slate-200 shadow-inner">
              <button 
                onClick={() => setView('editor')}
                className={`px-4 sm:px-8 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-xs font-black uppercase tracking-widest transition-all ${view === 'editor' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}
              >
                Editor
              </button>
              <button 
                onClick={() => setView('registry')}
                className={`px-4 sm:px-8 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-xs font-black uppercase tracking-widest transition-all ${view === 'registry' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}
              >
                Arhivă
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 pb-56">
        {view === 'editor' ? (
          <div className="space-y-8">
            <section className="bg-white rounded-[40px] shadow-sm border border-slate-200 p-6 md:p-10 space-y-8">
              <div className="flex items-center justify-between">
                 <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Informații Generale</h2>
                 <button onClick={createNewReport} className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-5 py-2.5 rounded-2xl active:scale-95 transition-all border border-red-100">Document Nou</button>
              </div>
              <div className="space-y-6">
                <input 
                  type="text" 
                  placeholder="Titlu Proces Verbal (ex: Predare Echipament IT)..."
                  value={report.title}
                  onChange={(e) => setReport(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:ring-8 focus:ring-blue-500/5 focus:bg-white focus:border-blue-500 outline-none transition-all font-black text-xl text-slate-900 placeholder:text-slate-300"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Locație</label>
                    <input 
                      type="text" 
                      value={report.location}
                      placeholder="ex: București, Sector 1"
                      onChange={(e) => setReport(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold text-base text-slate-900 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Data</label>
                    <input 
                      type="date" 
                      value={report.date}
                      onChange={(e) => setReport(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold text-base text-slate-900 focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Am Predat (Nume Complet)</label>
                    <input 
                      type="text" 
                      value={report.predator}
                      placeholder="Introduceți nume..."
                      onChange={(e) => setReport(prev => ({ ...prev, predator: e.target.value }))}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold text-base text-slate-900 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Am Primit (Nume Complet)</label>
                    <input 
                      type="text" 
                      value={report.primitor}
                      placeholder="Introduceți nume..."
                      onChange={(e) => setReport(prev => ({ ...prev, primitor: e.target.value }))}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold text-base text-slate-900 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Obiecte ({report.items.length})</h2>
                <button 
                  onClick={addItem}
                  className="bg-blue-600 text-white px-8 py-5 rounded-[24px] text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-2xl shadow-blue-600/30"
                >
                  Adaugă Bun
                </button>
              </div>

              <div className="space-y-8">
                {report.items.map(item => (
                  <ItemCard 
                    key={item.id} 
                    item={item} 
                    onUpdate={updateItem}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
                {report.items.length === 0 && (
                   <div className="bg-white border-4 border-dashed border-slate-200 rounded-[40px] py-24 text-center shadow-sm">
                    <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Lista este goală.</p>
                    <p className="text-slate-300 font-bold text-xs mt-2 italic">Adăugați un bun pentru a continua.</p>
                   </div>
                )}
              </div>
            </section>

            <section className="bg-white rounded-[40px] shadow-sm border border-slate-200 p-6 md:p-10 space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Observații</label>
                <button 
                  onClick={handlePolish}
                  disabled={!report.observations || isPolishing}
                  className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-5 py-3 rounded-2xl border border-blue-100 disabled:opacity-30 active:scale-95 transition-all flex items-center gap-2"
                >
                  {isPolishing ? 'Se procesează...' : '✨ Profesionalizează'}
                </button>
              </div>
              <textarea 
                rows={5}
                placeholder="Detalii despre starea bunurilor..."
                value={report.observations}
                onChange={(e) => setReport(prev => ({ ...prev, observations: e.target.value }))}
                className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:ring-8 focus:ring-blue-500/5 focus:bg-white outline-none text-base font-bold text-slate-900 leading-relaxed resize-none"
              />
            </section>

            <section className="bg-white rounded-[40px] shadow-sm border border-slate-200 p-6 md:p-10 space-y-8">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Semnături</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <SignaturePad 
                  label="Semnătură Predător" 
                  initialValue={report.signaturePredator}
                  onSave={(base64) => setReport(prev => ({ ...prev, signaturePredator: base64 }))}
                />
                <SignaturePad 
                  label="Semnătură Primitor" 
                  initialValue={report.signaturePrimitor}
                  onSave={(base64) => setReport(prev => ({ ...prev, signaturePrimitor: base64 }))}
                />
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-8">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Arhivă</h2>
            <div className="grid gap-6">
              {registry.map(r => (
                <div 
                  key={r.id}
                  onClick={() => loadFromRegistry(r)}
                  className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm active:scale-[0.99] transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${r.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-lg leading-tight">{r.title || 'Document fără titlu'}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{new Date(r.createdAt).toLocaleDateString('ro-RO')} • {r.items.length} Obiecte</p>
                    </div>
                  </div>
                  <button onClick={(e) => deleteFromRegistry(r.id, e)} className="p-4 text-slate-300 hover:text-red-500 active:scale-75 transition-all">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
              {registry.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[40px] border border-slate-100">
                  <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Arhiva este goală.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {view === 'editor' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-slate-200 p-6 safe-bottom z-40 print:hidden">
          <div className="max-w-5xl mx-auto flex gap-4">
            <button 
              onClick={saveToRegistry}
              className="flex-1 bg-slate-100 text-slate-900 px-8 py-5 rounded-[28px] text-xs font-black uppercase tracking-widest active:scale-95 transition-all border border-slate-200"
            >
              Salvează Ciornă
            </button>
            <button 
              onClick={() => setShowPreview(true)}
              disabled={!canFinalize}
              className={`flex-[2] px-8 py-5 rounded-[28px] text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 ${
                canFinalize ? 'bg-blue-600 text-white active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Previzualizare și Finalizare
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;