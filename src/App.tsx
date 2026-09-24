/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Save, 
  Trash2, 
  ArrowLeft,
  ChevronRight,
  AlertTriangle,
  Download,
  Share2,
  WifiOff,
  LayoutDashboard,
  ShieldAlert,
  MapPin,
  Activity,
  CheckCircle2,
  Camera,
  X
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { InspectionReport, HazardEntry, ZoneStatus, SeverityLevel } from './types';
import { HAZARD_CATEGORIES, ZONE_STATUSES, DEFAULT_HAZARD_ENTRY } from './data/checklist';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generatePDF } from './utils/pdf';
import { PWAInstallButton } from './components/PWAInstallButton';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Hooks ---

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// --- Components ---

const OfflineIndicator = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-xs font-black text-white shadow-2xl border-2 border-white">
      <WifiOff className="w-4 h-4" />
      OFFLINE MODE
    </div>
  );
};

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost', size?: 'sm' | 'md' | 'lg' }>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-blue-700 text-white hover:bg-blue-800 shadow-sm',
      secondary: 'bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 shadow-sm',
      danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
      ghost: 'bg-transparent text-zinc-600 hover:bg-zinc-100'
    };
    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);

const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <label className={cn('text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5 block', className)}>
    {children}
  </label>
);

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'dashboard' | 'form'>('dashboard');
  const [reports, setReports] = useState<InspectionReport[]>([]);
  const [currentReport, setCurrentReport] = useState<InspectionReport | null>(null);
  const [activeHazardIndex, setActiveHazardIndex] = useState<number>(-1); // -1 for Report Header

  useEffect(() => {
    const savedReports = localStorage.getItem('ksia_hazard_reports');
    if (savedReports) {
      try {
        setReports(JSON.parse(savedReports));
      } catch (e) {
        console.error('Failed to load reports', e);
      }
    }
  }, []);

  const saveReports = useCallback((updatedReports: InspectionReport[]) => {
    setReports(updatedReports);
    localStorage.setItem('ksia_hazard_reports', JSON.stringify(updatedReports));
  }, []);

  const createNewReport = () => {
    const newReport: InspectionReport = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDraft: true,
      facility: 'King Salman International Airport',
      terminal: '',
      floor: '',
      sector: '',
      reporterName: '',
      staffId: '',
      role: '',
      shift: 'Morning',
      reportingDate: format(new Date(), 'yyyy-MM-dd'),
      hazards: [],
      reporterSignature: '',
      supervisorSignature: '',
      aocAcknowledgement: ''
    };
    setCurrentReport(newReport);
    setActiveHazardIndex(-1);
    setView('form');
  };

  const handleSave = () => {
    if (!currentReport) return;
    const updatedReport = { ...currentReport, updatedAt: new Date().toISOString() };
    const existingIndex = reports.findIndex(r => r.id === updatedReport.id);
    let newReports: InspectionReport[];
    if (existingIndex > -1) {
      newReports = [...reports];
      newReports[existingIndex] = updatedReport;
    } else {
      newReports = [updatedReport, ...reports];
    }
    saveReports(newReports);
    setCurrentReport(updatedReport);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this report?')) {
      const updatedReports = reports.filter(r => r.id !== id);
      saveReports(updatedReports);
    }
  };

  const openReport = (report: InspectionReport) => {
    setCurrentReport(JSON.parse(JSON.stringify(report)));
    setActiveHazardIndex(-1);
    setView('form');
  };

  const updateReportField = (field: keyof InspectionReport, value: any) => {
    if (!currentReport) return;
    setCurrentReport({ ...currentReport, [field]: value });
  };

  const addHazard = () => {
    if (!currentReport) return;
    const newHazard: HazardEntry = {
      ...DEFAULT_HAZARD_ENTRY,
      id: uuidv4(),
      photos: []
    } as HazardEntry;
    const updatedHazards = [...currentReport.hazards, newHazard];
    setCurrentReport({ ...currentReport, hazards: updatedHazards });
    setActiveHazardIndex(updatedHazards.length - 1);
  };

  const updateHazardField = (index: number, field: keyof HazardEntry, value: any) => {
    if (!currentReport) return;
    const updatedHazards = [...currentReport.hazards];
    updatedHazards[index] = { ...updatedHazards[index], [field]: value };
    
    // Auto-calculate risk level if likelihood or consequence changed
    if (field === 'likelihood' || field === 'consequence') {
      const h = updatedHazards[index];
      const riskIndex = h.likelihood * h.consequence;
      let level: SeverityLevel = 'Low';
      if (riskIndex >= 16) level = 'Critical';
      else if (riskIndex >= 10) level = 'High';
      else if (riskIndex >= 5) level = 'Medium';
      updatedHazards[index].riskLevel = level;
    }
    
    setCurrentReport({ ...currentReport, hazards: updatedHazards });
  };

  const removeHazard = (index: number) => {
    if (!currentReport) return;
    if (confirm('Remove this hazard entry?')) {
      const updatedHazards = [...currentReport.hazards];
      updatedHazards.splice(index, 1);
      setCurrentReport({ ...currentReport, hazards: updatedHazards });
      setActiveHazardIndex(-1);
    }
  };

  const handlePhotoCapture = (hazardIndex: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const currentPhotos = currentReport?.hazards[hazardIndex].photos || [];
      updateHazardField(hazardIndex, 'photos', [...currentPhotos, base64]);
    };
    reader.readAsDataURL(file);
  };

  const handleExportPDF = async () => {
    if (!currentReport) return;
    await generatePDF(currentReport);
  };

  // --- Rendering ---

  const renderDashboard = () => (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 mb-2 uppercase">KSIA 4-Part Reporting</h1>
          <p className="text-zinc-500 font-medium tracking-tight">Standardized Hazard & Zone Status Platform · Section 3.1.2.4a</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <PWAInstallButton />
          <Button onClick={createNewReport} className="h-12 px-8">
            <Plus className="w-5 h-5" />
            New Hazard Report
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <ShieldAlert className="w-8 h-8 text-blue-600 mb-4" />
          <h3 className="text-sm font-black uppercase text-zinc-400 mb-1">Total Reports</h3>
          <p className="text-3xl font-black text-zinc-900">{reports.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <Activity className="w-8 h-8 text-amber-500 mb-4" />
          <h3 className="text-sm font-black uppercase text-zinc-400 mb-1">Pending Hazards</h3>
          <p className="text-3xl font-black text-zinc-900">
            {reports.reduce((acc, r) => acc + r.hazards.length, 0)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-4" />
          <h3 className="text-sm font-black uppercase text-zinc-400 mb-1">Status</h3>
          <p className="text-3xl font-black text-zinc-900">Compliant</p>
        </div>
      </div>

      <section className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Hazard Logs</h2>
          <LayoutDashboard className="w-4 h-4 text-zinc-300" />
        </div>
        {reports.length === 0 ? (
          <div className="p-20 text-center">
            <ShieldAlert className="w-16 h-16 text-zinc-100 mx-auto mb-6" />
            <p className="text-zinc-500 font-medium">No reports generated yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {reports.map(report => (
              <div 
                key={report.id} 
                className="p-6 hover:bg-zinc-50 transition-colors flex items-center justify-between gap-6 cursor-pointer"
                onClick={() => openReport(report)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-black text-zinc-900 truncate">
                      {report.terminal} {report.sector && `— ${report.sector}`}
                    </span>
                    {report.isDraft && (
                      <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">Draft</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {report.reportingDate}
                    </span>
                    <span className="flex items-center gap-1.5 text-zinc-500">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      {report.hazards.length} Hazard{report.hazards.length !== 1 ? 's' : ''}
                    </span>
                    <span>By {report.reporterName || 'Anonymous'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-zinc-300 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => { e.stopPropagation(); handleDelete(report.id); }}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                  <ChevronRight className="w-6 h-6 text-zinc-200" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="mt-16 pt-8 border-t border-zinc-100 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-400 font-black">
          King Salman International Airport · Riyadh, KSA · Standardized Reporting Framework
        </p>
      </footer>
    </div>
  );

  const renderForm = () => {
    if (!currentReport) return null;

    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col">
        {/* Nav Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 px-4 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setView('dashboard')}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h2 className="text-sm font-black text-zinc-900 uppercase tracking-widest leading-none mb-1">Hazard Reporting</h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter truncate max-w-[150px]">
                {currentReport.terminal || 'New Report'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleSave}>
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Save</span>
            </Button>
            <Button size="sm" onClick={handleExportPDF}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-zinc-200 hidden lg:flex flex-col">
            <div className="p-4 border-b border-zinc-100">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Navigation</p>
            </div>
            <nav className="flex-1 overflow-y-auto p-2 space-y-1">
              <button
                onClick={() => setActiveHazardIndex(-1)}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
                  activeHazardIndex === -1 ? 'bg-blue-50 text-blue-700' : 'text-zinc-500 hover:bg-zinc-50'
                )}
              >
                1. Report Header
              </button>
              <div className="h-px bg-zinc-100 my-2" />
              <p className="px-4 py-2 text-[9px] font-black text-zinc-300 uppercase tracking-[0.2em]">Hazards & Zones</p>
              {currentReport.hazards.map((h, i) => (
                <button
                  key={h.id}
                  onClick={() => setActiveHazardIndex(i)}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-between group',
                    activeHazardIndex === i ? 'bg-amber-50 text-amber-700' : 'text-zinc-500 hover:bg-zinc-50'
                  )}
                >
                  <span className="truncate">{i + 1}. {h.zoneId || 'Unset Zone'}</span>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    h.riskLevel === 'Low' ? "bg-emerald-400" :
                    h.riskLevel === 'Medium' ? "bg-amber-400" :
                    h.riskLevel === 'High' ? "bg-orange-400" : "bg-red-500"
                  )} />
                </button>
              ))}
              <Button 
                variant="ghost" 
                className="w-full justify-start text-blue-600 hover:bg-blue-50 mt-4 h-12"
                onClick={addHazard}
              >
                <Plus className="w-4 h-4" />
                Add Hazard
              </Button>
            </nav>
            <div className="p-4 border-t border-zinc-100">
              <div className="bg-zinc-900 rounded-xl p-3">
                <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Standard 3.1.2.4a</p>
                <p className="text-[9px] text-zinc-400 leading-tight">Follow the 4-part structure for all entries.</p>
              </div>
            </div>
          </aside>

          {/* Form Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-10">
            <div className="max-w-4xl mx-auto space-y-12">
              {activeHazardIndex === -1 ? (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                  <section>
                    <h3 className="text-2xl font-black text-zinc-900 mb-8 border-b-4 border-blue-600 pb-2 inline-block">REPORT ADMINISTRATIVE DATA</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <Label>Facility Name</Label>
                        <Input value={currentReport.facility} readOnly className="bg-zinc-50 font-bold" />
                      </div>
                      <div>
                        <Label>Terminal / Concourse</Label>
                        <Input 
                          value={currentReport.terminal} 
                          onChange={e => updateReportField('terminal', e.target.value)}
                          placeholder="e.g. Terminal 1 North"
                        />
                      </div>
                      <div>
                        <Label>Sector / Area</Label>
                        <Input 
                          value={currentReport.sector} 
                          onChange={e => updateReportField('sector', e.target.value)}
                          placeholder="e.g. Check-in Row 4"
                        />
                      </div>
                      <div>
                        <Label>Floor Level</Label>
                        <Input 
                          value={currentReport.floor} 
                          onChange={e => updateReportField('floor', e.target.value)}
                          placeholder="e.g. L2 (Arrivals)"
                        />
                      </div>
                      <div>
                        <Label>Reporting Date</Label>
                        <Input 
                          type="date"
                          value={currentReport.reportingDate} 
                          onChange={e => updateReportField('reportingDate', e.target.value)}
                        />
                      </div>
                    </div>
                  </section>

                  <section className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
                    <h4 className="text-sm font-black text-zinc-900 uppercase tracking-[0.2em] mb-6">Reporter Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label>Full Name</Label>
                        <Input 
                          value={currentReport.reporterName} 
                          onChange={e => updateReportField('reporterName', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Staff ID</Label>
                        <Input 
                          value={currentReport.staffId} 
                          onChange={e => updateReportField('staffId', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Operational Role</Label>
                        <Input 
                          value={currentReport.role} 
                          onChange={e => updateReportField('role', e.target.value)}
                          placeholder="e.g. HSE Officer"
                        />
                      </div>
                    </div>
                  </section>

                  <div className="flex justify-end">
                    <Button size="lg" className="px-12" onClick={addHazard}>
                      Begin Hazard Assessment
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
                  <header className="flex items-center justify-between">
                    <div>
                      <h3 className="text-3xl font-black text-zinc-900 uppercase leading-none mb-2">4-PART HAZARD ENTRY</h3>
                      <p className="text-sm font-bold text-zinc-400">Entry #{activeHazardIndex + 1} of {currentReport.hazards.length}</p>
                    </div>
                    <Button variant="ghost" className="text-red-500" onClick={() => removeHazard(activeHazardIndex)}>
                      <Trash2 className="w-5 h-5" />
                      Remove
                    </Button>
                  </header>

                  <div className="grid grid-cols-1 gap-12">
                    {/* Part 1 */}
                    <section className="bg-white p-8 rounded-3xl border-l-8 border-blue-600 shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                        <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black">1</span>
                        <h4 className="text-lg font-black text-zinc-900 uppercase">Hazard Identification</h4>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <Label>Hazard Category</Label>
                          <div className="flex flex-wrap gap-2">
                            {HAZARD_CATEGORIES.map(cat => (
                              <button
                                key={cat}
                                onClick={() => updateHazardField(activeHazardIndex, 'hazardCategory', cat)}
                                className={cn(
                                  'px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg border-2 transition-all',
                                  currentReport.hazards[activeHazardIndex].hazardCategory === cat
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                                    : 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200'
                                )}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label>Detailed Hazard Description</Label>
                          <Textarea 
                            value={currentReport.hazards[activeHazardIndex].hazardDescription}
                            onChange={e => updateHazardField(activeHazardIndex, 'hazardDescription', e.target.value)}
                            placeholder="Describe the unsafe act or condition..."
                          />
                        </div>
                        <div>
                          <Label>Visual Evidence (Photos)</Label>
                          <div className="flex flex-wrap gap-4 mt-2">
                            {currentReport.hazards[activeHazardIndex].photos.map((p, pIdx) => (
                              <div key={pIdx} className="relative w-24 h-24 group">
                                <img src={p} className="w-full h-full object-cover rounded-xl border border-zinc-200" />
                                <button 
                                  onClick={() => {
                                    const newPhotos = [...currentReport.hazards[activeHazardIndex].photos];
                                    newPhotos.splice(pIdx, 1);
                                    updateHazardField(activeHazardIndex, 'photos', newPhotos);
                                  }}
                                  className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            <label className="w-24 h-24 border-2 border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 transition-all active:scale-95">
                              <Camera className="w-6 h-6 text-zinc-300" />
                              <span className="text-[9px] font-black text-zinc-400 uppercase mt-2">Add Photo</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment" 
                                className="hidden" 
                                onChange={e => e.target.files?.[0] && handlePhotoCapture(activeHazardIndex, e.target.files[0])}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Part 2 */}
                    <section className="bg-white p-8 rounded-3xl border-l-8 border-amber-500 shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                        <span className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-black">2</span>
                        <h4 className="text-lg font-black text-zinc-900 uppercase">Zone Status</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label>Zone / Asset ID</Label>
                          <Input 
                            value={currentReport.hazards[activeHazardIndex].zoneId}
                            onChange={e => updateHazardField(activeHazardIndex, 'zoneId', e.target.value)}
                            placeholder="e.g. ZN-401 or DOOR-H2"
                          />
                        </div>
                        <div>
                          <Label>Zone Status</Label>
                          <select 
                            value={currentReport.hazards[activeHazardIndex].zoneStatus}
                            onChange={e => updateHazardField(activeHazardIndex, 'zoneStatus', e.target.value)}
                            className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            {ZONE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <Label>Precise Location Details</Label>
                          <Input 
                            value={currentReport.hazards[activeHazardIndex].locationDetails}
                            onChange={e => updateHazardField(activeHazardIndex, 'locationDetails', e.target.value)}
                            placeholder="e.g. South wall, behind catering station B"
                          />
                        </div>
                      </div>
                    </section>

                    {/* Part 3 */}
                    <section className="bg-white p-8 rounded-3xl border-l-8 border-emerald-500 shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                        <span className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black">3</span>
                        <h4 className="text-lg font-black text-zinc-900 uppercase">Impact & Risk Assessment</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div>
                            <Label>Likelihood (1-5)</Label>
                            <input 
                              type="range" min="1" max="5" 
                              value={currentReport.hazards[activeHazardIndex].likelihood}
                              onChange={e => updateHazardField(activeHazardIndex, 'likelihood', Number(e.target.value))}
                              className="w-full accent-emerald-500"
                            />
                            <div className="flex justify-between text-[10px] font-black text-zinc-400 mt-2">
                              <span>RARE</span>
                              <span>UNLIKELY</span>
                              <span>POSSIBLE</span>
                              <span>LIKELY</span>
                              <span>CERTAIN</span>
                            </div>
                          </div>
                          <div>
                            <Label>Consequence (1-5)</Label>
                            <input 
                              type="range" min="1" max="5" 
                              value={currentReport.hazards[activeHazardIndex].consequence}
                              onChange={e => updateHazardField(activeHazardIndex, 'consequence', Number(e.target.value))}
                              className="w-full accent-emerald-500"
                            />
                            <div className="flex justify-between text-[10px] font-black text-zinc-400 mt-2">
                              <span>INSIG.</span>
                              <span>MINOR</span>
                              <span>MODERATE</span>
                              <span>MAJOR</span>
                              <span>CATAST.</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-zinc-50 rounded-2xl p-6 flex flex-col items-center justify-center border border-zinc-100">
                          <Label className="mb-4">Calculated Risk Level</Label>
                          <div className={cn(
                            "w-32 h-32 rounded-full flex flex-col items-center justify-center text-white shadow-xl animate-in zoom-in-75 duration-300",
                            currentReport.hazards[activeHazardIndex].riskLevel === 'Low' ? "bg-emerald-500" :
                            currentReport.hazards[activeHazardIndex].riskLevel === 'Medium' ? "bg-amber-500" :
                            currentReport.hazards[activeHazardIndex].riskLevel === 'High' ? "bg-orange-500" : "bg-red-600"
                          )}>
                            <span className="text-2xl font-black">{currentReport.hazards[activeHazardIndex].likelihood * currentReport.hazards[activeHazardIndex].consequence}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">{currentReport.hazards[activeHazardIndex].riskLevel}</span>
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <Label>Potential Operational Impact</Label>
                          <Textarea 
                            value={currentReport.hazards[activeHazardIndex].potentialImpact}
                            onChange={e => updateHazardField(activeHazardIndex, 'potentialImpact', e.target.value)}
                            placeholder="What happens if this hazard is not addressed?"
                          />
                        </div>
                      </div>
                    </section>

                    {/* Part 4 */}
                    <section className="bg-white p-8 rounded-3xl border-l-8 border-red-600 shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                        <span className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-black">4</span>
                        <h4 className="text-lg font-black text-zinc-900 uppercase">Recovery & Action</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <Label>Immediate Action Taken (Containment)</Label>
                          <Input 
                            value={currentReport.hazards[activeHazardIndex].immediateActionTaken}
                            onChange={e => updateHazardField(activeHazardIndex, 'immediateActionTaken', e.target.value)}
                            placeholder="What did you do right now to make it safe?"
                          />
                        </div>
                        <div>
                          <Label>Recommended Permanent Action</Label>
                          <Input 
                            value={currentReport.hazards[activeHazardIndex].recommendedAction}
                            onChange={e => updateHazardField(activeHazardIndex, 'recommendedAction', e.target.value)}
                            placeholder="Long-term fix"
                          />
                        </div>
                        <div>
                          <Label>Action Owner / Responsible Party</Label>
                          <Input 
                            value={currentReport.hazards[activeHazardIndex].owner}
                            onChange={e => updateHazardField(activeHazardIndex, 'owner', e.target.value)}
                            placeholder="e.g. Technical Dept"
                          />
                        </div>
                        <div>
                          <Label>Target Resolution Date</Label>
                          <Input 
                            type="date"
                            value={currentReport.hazards[activeHazardIndex].targetDate}
                            onChange={e => updateHazardField(activeHazardIndex, 'targetDate', e.target.value)}
                          />
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-12 border-t border-zinc-100">
                    <Button variant="secondary" size="lg" className="w-full sm:w-auto" onClick={() => setActiveHazardIndex(activeHazardIndex - 1)}>
                      <ArrowLeft className="w-5 h-5" />
                      Previous Entry
                    </Button>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button variant="secondary" size="lg" className="flex-1 sm:flex-none" onClick={addHazard}>
                        <Plus className="w-5 h-5" />
                        Add New
                      </Button>
                      <Button size="lg" className="flex-1 sm:flex-none" onClick={() => setActiveHazardIndex(activeHazardIndex + 1 < currentReport.hazards.length ? activeHazardIndex + 1 : -1)}>
                        Continue
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
        <OfflineIndicator />
      </div>
    );
  };

  return view === 'dashboard' ? renderDashboard() : renderForm();
}
