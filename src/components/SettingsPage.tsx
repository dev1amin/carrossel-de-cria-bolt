import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Building, Users, Target, Pencil, Save, X, Plus, Trash2, Upload, Loader2, Globe, Sparkles } from 'lucide-react';
import Navigation from './Navigation';
import { ToneSetupModal } from './ToneSetupModal';
import { 
  getUserSettings, 
  updateBusiness, 
  addInfluencer, 
  removeInfluencer, 
  addNiches, 
  removeNiches 
} from '../services/settings';
import { UserSettings, Niche } from '../types/settings';

interface SettingsPageProps {
  onPageChange: (page: 'feed' | 'settings') => void;
  setIsLoading: (loading: boolean) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ setIsLoading }) => {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('negocio');
  
  // Estados de edição
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  
  // Modal de tom de voz
  const [showToneModal, setShowToneModal] = useState(false);
  
  // Estados do formulário de negócio
  const [businessForm, setBusinessForm] = useState({
    name: '',
    website: '',
    linkedin: '',
    instagram: '',
    objective: '',
    voice_tone: '',
    social_type: '' as string,
    target_audience: '',
    brand_positioning: '',
    forbidden_words: [] as string[],
    forbidden_topics: [] as string[],
    preferred_words: [] as string[],
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para influenciadores
  const [newInfluencer, setNewInfluencer] = useState('');
  const [isAddingInfluencer, setIsAddingInfluencer] = useState(false);
  const [showInfluencerInput, setShowInfluencerInput] = useState(false);
  
  // Estados para nichos
  const [newNiche, setNewNiche] = useState('');
  const [isAddingNiche, setIsAddingNiche] = useState(false);
  const [showNicheInput, setShowNicheInput] = useState(false);

  // Estados para inputs de arrays (palavras)
  const [newForbiddenWord, setNewForbiddenWord] = useState('');
  const [newForbiddenTopic, setNewForbiddenTopic] = useState('');
  const [newPreferredWord, setNewPreferredWord] = useState('');

  const loadUserSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const settings = await getUserSettings();
      setUserSettings(settings);
      if (settings.business) {
        setBusinessForm({
          name: settings.business.name || '',
          website: settings.business.website || '',
          linkedin: settings.business.linkedin || '',
          instagram: settings.business.instagram || '',
          objective: settings.business.objective || '',
          voice_tone: settings.business.voice_tone || '',
          social_type: settings.business.social_type || '',
          target_audience: settings.business.target_audience || '',
          brand_positioning: settings.business.brand_positioning || '',
          forbidden_words: settings.business.forbidden_words || settings.forbidden_words || [],
          forbidden_topics: settings.business.forbidden_topics || settings.forbidden_topics || [],
          preferred_words: settings.business.preferred_words || settings.preferred_words || [],
        });
        if (settings.business.logo_url) {
          setLogoPreview(settings.business.logo_url);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsPageLoading(false);
      setIsLoading(false);
    }
  }, [setIsLoading]);

  useEffect(() => {
    loadUserSettings();
  }, [loadUserSettings]);

  const showSuccess = (message: string) => {
    setSaveSuccess(message);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const handleSaveBusiness = async () => {
    setIsSaving(true);
    try {
      await updateBusiness({
        name: businessForm.name || undefined,
        website: businessForm.website || null,
        linkedin: businessForm.linkedin || null,
        instagram: businessForm.instagram || null,
        objective: businessForm.objective || null,
        voice_tone: businessForm.voice_tone || null,
        social_type: (businessForm.social_type as any) || null,
        target_audience: businessForm.target_audience || null,
        brand_positioning: businessForm.brand_positioning || null,
        forbidden_words: businessForm.forbidden_words.length > 0 ? businessForm.forbidden_words : null,
        forbidden_topics: businessForm.forbidden_topics.length > 0 ? businessForm.forbidden_topics : null,
        preferred_words: businessForm.preferred_words.length > 0 ? businessForm.preferred_words : null,
      }, logoFile || undefined);
      
      await loadUserSettings();
      setIsEditingBusiness(false);
      setLogoFile(null);
      showSuccess('Negócio atualizado com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddInfluencer = async () => {
    if (!newInfluencer.trim()) return;
    
    setIsAddingInfluencer(true);
    try {
      await addInfluencer({
        handle: newInfluencer.replace('@', ''),
      });
      
      setNewInfluencer('');
      setShowInfluencerInput(false);
      await loadUserSettings();
      showSuccess('Influenciador adicionado!');
    } catch (err) {
      if (err instanceof Error && err.message === 'ALREADY_FAVORITED') {
        setError('Este influenciador já está na sua lista');
      } else {
        setError(err instanceof Error ? err.message : 'Erro ao adicionar influenciador');
      }
    } finally {
      setIsAddingInfluencer(false);
    }
  };

  const handleRemoveInfluencer = async (influencerId: string) => {
    try {
      await removeInfluencer(influencerId);
      await loadUserSettings();
      showSuccess('Influenciador removido!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover influenciador');
    }
  };

  const handleAddNiche = async () => {
    if (!newNiche.trim()) return;
    
    setIsAddingNiche(true);
    try {
      await addNiches({
        custom_niche: [newNiche.trim()],
      });
      
      setNewNiche('');
      setShowNicheInput(false);
      await loadUserSettings();
      showSuccess('Nicho adicionado!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar nicho');
    } finally {
      setIsAddingNiche(false);
    }
  };

  const handleRemoveNiche = async (niche: Niche) => {
    try {
      await removeNiches({
        niche_id: [niche.id],
      });
      await loadUserSettings();
      showSuccess('Nicho removido!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover nicho');
    }
  };

  const cancelEditBusiness = () => {
    setIsEditingBusiness(false);
    setLogoFile(null);
    if (userSettings?.business) {
      setBusinessForm({
        name: userSettings.business.name || '',
        website: userSettings.business.website || '',
        linkedin: userSettings.business.linkedin || '',
        instagram: userSettings.business.instagram || '',
        objective: userSettings.business.objective || '',
        voice_tone: userSettings.business.voice_tone || '',
        social_type: userSettings.business.social_type || '',
        target_audience: userSettings.business.target_audience || '',
        brand_positioning: userSettings.business.brand_positioning || '',
        forbidden_words: userSettings.business.forbidden_words || userSettings.forbidden_words || [],
        forbidden_topics: userSettings.business.forbidden_topics || userSettings.forbidden_topics || [],
        preferred_words: userSettings.business.preferred_words || userSettings.preferred_words || [],
      });
      setLogoPreview(userSettings.business.logo_url || null);
    }
  };

  // Handlers para adicionar/remover palavras
  const handleAddForbiddenWord = () => {
    if (newForbiddenWord.trim() && !businessForm.forbidden_words.includes(newForbiddenWord.trim())) {
      setBusinessForm(prev => ({
        ...prev,
        forbidden_words: [...prev.forbidden_words, newForbiddenWord.trim()]
      }));
      setNewForbiddenWord('');
    }
  };

  const handleRemoveForbiddenWord = (word: string) => {
    setBusinessForm(prev => ({
      ...prev,
      forbidden_words: prev.forbidden_words.filter(w => w !== word)
    }));
  };

  const handleAddForbiddenTopic = () => {
    if (newForbiddenTopic.trim() && !businessForm.forbidden_topics.includes(newForbiddenTopic.trim())) {
      setBusinessForm(prev => ({
        ...prev,
        forbidden_topics: [...prev.forbidden_topics, newForbiddenTopic.trim()]
      }));
      setNewForbiddenTopic('');
    }
  };

  const handleRemoveForbiddenTopic = (topic: string) => {
    setBusinessForm(prev => ({
      ...prev,
      forbidden_topics: prev.forbidden_topics.filter(t => t !== topic)
    }));
  };

  const handleAddPreferredWord = () => {
    if (newPreferredWord.trim() && !businessForm.preferred_words.includes(newPreferredWord.trim())) {
      setBusinessForm(prev => ({
        ...prev,
        preferred_words: [...prev.preferred_words, newPreferredWord.trim()]
      }));
      setNewPreferredWord('');
    }
  };

  const handleRemovePreferredWord = (word: string) => {
    setBusinessForm(prev => ({
      ...prev,
      preferred_words: prev.preferred_words.filter(w => w !== word)
    }));
  };

  const handleToneSetupComplete = async () => {
    setShowToneModal(false);
    await loadUserSettings();
    showSuccess('Tom de voz atualizado com sucesso!');
  };

  // Loading state
  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500/30 border-t-blue-500"></div>
      </div>
    );
  }

  // Componente para renderizar campo (visualização ou edição)
  const FieldDisplay = ({ 
    label, 
    value, 
    link, 
    isEditing, 
    inputValue,
    onChange,
    placeholder,
    type = 'text',
    rows
  }: { 
    label: string; 
    value?: string | null; 
    link?: string | null;
    isEditing: boolean;
    inputValue?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    type?: 'text' | 'url' | 'textarea';
    rows?: number;
  }) => (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
      {isEditing ? (
        type === 'textarea' ? (
          <textarea
            value={inputValue || ''}
            onChange={(e) => {
              onChange?.(e.target.value);
              // Auto-resize
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            placeholder={placeholder}
            rows={rows || 2}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 resize-none overflow-hidden"
            style={{ minHeight: '60px' }}
            ref={(el) => {
              if (el) {
                el.style.height = 'auto';
                el.style.height = el.scrollHeight + 'px';
              }
            }}
          />
        ) : (
          <input
            type={type}
            value={inputValue || ''}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          />
        )
      ) : (
        value ? (
          link ? (
            <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 transition-colors block">
              {value}
            </a>
          ) : (
            <p className="text-gray-800">{value}</p>
          )
        ) : (
          <p className="text-gray-400 italic">Não definido</p>
        )
      )}
    </div>
  );

  // Componente para lista de tags (palavras)
  const TagsField = ({
    label,
    tags,
    isEditing,
    newValue,
    onNewValueChange,
    onAdd,
    onRemove,
    placeholder,
    color = 'blue'
  }: {
    label: string;
    tags: string[];
    isEditing: boolean;
    newValue?: string;
    onNewValueChange?: (value: string) => void;
    onAdd?: () => void;
    onRemove?: (tag: string) => void;
    placeholder?: string;
    color?: 'blue' | 'red' | 'green';
  }) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
      red: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
      green: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
    };
    
    return (
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
        
        {isEditing && (
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newValue || ''}
              onChange={(e) => onNewValueChange?.(e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all duration-200"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd?.())}
            />
            <button
              onClick={onAdd}
              disabled={!newValue?.trim()}
              className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          {tags.length === 0 ? (
            <p className="text-gray-400 italic text-sm">Nenhum item</p>
          ) : (
            tags.map((tag, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${colorClasses[color]} transition-colors`}
              >
                {tag}
                {isEditing && (
                  <button
                    onClick={() => onRemove?.(tag)}
                    className="hover:opacity-70 transition-opacity"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </span>
            ))
          )}
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'negocio', label: 'Negócio', icon: Building },
    { id: 'influenciadores', label: 'Influenciadores', icon: Users },
    { id: 'nicho', label: 'Nichos', icon: Target },
  ];

  return (
    <div className="flex h-screen bg-white">
      <Navigation currentPage="settings" unviewedCount={0} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative ml-16">
        {/* Grid Background */}
        <div
          className="pointer-events-none fixed top-0 left-0 md:left-20 right-0 bottom-0 opacity-60"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Colored Blobs */}
        <div className="fixed pointer-events-none" style={{ top: '10%', left: '8%', width: '300px', height: '300px', borderRadius: '50%', background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)', opacity: 0.3, filter: 'blur(80px)', animation: 'float 8s ease-in-out infinite' }} />
        <div className="fixed pointer-events-none" style={{ top: '5%', right: '12%', width: '250px', height: '250px', borderRadius: '50%', background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)', opacity: 0.25, filter: 'blur(70px)', animation: 'float 10s ease-in-out infinite reverse' }} />
        <div className="fixed pointer-events-none" style={{ top: '40%', left: '5%', width: '280px', height: '280px', borderRadius: '50%', background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)', opacity: 0.2, filter: 'blur(75px)', animation: 'float 11s ease-in-out infinite' }} />
        <div className="fixed pointer-events-none" style={{ bottom: '15%', right: '20%', width: '260px', height: '260px', borderRadius: '50%', background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)', opacity: 0.22, filter: 'blur(70px)', animation: 'float 12s ease-in-out infinite reverse' }} />

        {/* Toast de sucesso */}
        {saveSuccess && (
          <div className="fixed top-6 right-6 z-50 px-6 py-4 rounded-xl bg-emerald-500 text-white shadow-lg animate-fade-in flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            {saveSuccess}
          </div>
        )}

        {/* Toast de erro */}
        {error && (
          <div className="fixed top-6 right-6 z-50 px-6 py-4 rounded-xl bg-red-500 text-white shadow-lg flex items-center gap-3">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-600 rounded-lg transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Modal de Tom de Voz */}
        <ToneSetupModal
          isOpen={showToneModal}
          onClose={() => setShowToneModal(false)}
          onComplete={handleToneSetupComplete}
        />

        <div className="max-w-5xl mx-auto px-6 py-12 relative z-10">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Configurações</h1>
            <p className="mt-2 text-gray-500">Gerencie seu perfil e preferências</p>
          </div>

          {/* Profile Card */}
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-sm p-6 mb-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                {userSettings?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">{userSettings?.name}</h2>
                <p className="text-gray-500 text-sm mt-1.5">{userSettings?.email}</p>
              </div>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                Membro desde {userSettings ? new Date(userSettings.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : ''}
              </span>
            </div>
          </div>

          {/* Main Card with Tabs */}
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Tabs Header */}
            <div className="flex border-b border-gray-200 bg-gray-50/50">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-200
                    ${activeTab === tab.id 
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-white -mb-px' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                    }
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {/* Business Tab */}
              {activeTab === 'negocio' && userSettings && (
                <div className="space-y-8">
                  {/* Header with Actions */}
                  <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Informações do Negócio</h2>
                      <p className="text-gray-500 text-sm mt-1">Configure os dados da sua empresa</p>
                    </div>
                    <div className="flex gap-3">
                      {!isEditingBusiness ? (
                        <>
                          <button
                            onClick={() => setShowToneModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200 transition-all duration-200"
                          >
                            <Sparkles className="h-4 w-4" />
                            Refazer Tom de Voz
                          </button>
                          <button
                            onClick={() => setIsEditingBusiness(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-all duration-200"
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={cancelEditBusiness}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 transition-all duration-200 disabled:opacity-50"
                          >
                            <X className="h-4 w-4" />
                            Cancelar
                          </button>
                          <button
                            onClick={handleSaveBusiness}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-blue-500 text-white hover:bg-blue-600 transition-all duration-200 disabled:opacity-50"
                          >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Salvar
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Logo and Basic Info */}
                  <div className="flex items-start gap-6 pb-6 border-b border-gray-100">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-2xl bg-gray-100 border-2 border-gray-200 overflow-hidden flex items-center justify-center">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Building className="w-10 h-10 text-gray-400" />
                        )}
                      </div>
                      {isEditingBusiness && (
                        <>
                          <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="hidden"
                          />
                          <button
                            onClick={() => logoInputRef.current?.click()}
                            className="absolute -bottom-2 -right-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg"
                          >
                            <Upload className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <FieldDisplay
                        label="Nome da Empresa"
                        value={userSettings.business.name}
                        isEditing={isEditingBusiness}
                        inputValue={businessForm.name}
                        onChange={(v) => setBusinessForm(prev => ({ ...prev, name: v }))}
                        placeholder="Sua empresa"
                      />
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo de Social</label>
                        {isEditingBusiness ? (
                          <select
                            value={businessForm.social_type}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, social_type: e.target.value }))}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                          >
                            <option value="">Selecione...</option>
                            <option value="Marca pessoal">Marca pessoal</option>
                            <option value="Empresa">Empresa</option>
                          </select>
                        ) : (
                          userSettings.business.social_type ? (
                            <span className="inline-flex px-3 py-1.5 text-sm font-medium rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                              {userSettings.business.social_type}
                            </span>
                          ) : (
                            <p className="text-gray-400 italic">Não definido</p>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="grid grid-cols-3 gap-6 pb-6 border-b border-gray-100">
                    <FieldDisplay
                      label="Website"
                      value={userSettings.business.website}
                      link={userSettings.business.website}
                      isEditing={isEditingBusiness}
                      inputValue={businessForm.website}
                      onChange={(v) => setBusinessForm(prev => ({ ...prev, website: v }))}
                      placeholder="https://exemplo.com"
                      type="url"
                    />
                    <FieldDisplay
                      label="Instagram"
                      value={userSettings.business.instagram ? `@${userSettings.business.instagram}` : null}
                      link={userSettings.business.instagram ? `https://instagram.com/${userSettings.business.instagram}` : null}
                      isEditing={isEditingBusiness}
                      inputValue={businessForm.instagram}
                      onChange={(v) => setBusinessForm(prev => ({ ...prev, instagram: v }))}
                      placeholder="@usuario"
                    />
                    <FieldDisplay
                      label="LinkedIn"
                      value={userSettings.business.linkedin}
                      link={userSettings.business.linkedin ? `https://linkedin.com/company/${userSettings.business.linkedin}` : null}
                      isEditing={isEditingBusiness}
                      inputValue={businessForm.linkedin}
                      onChange={(v) => setBusinessForm(prev => ({ ...prev, linkedin: v }))}
                      placeholder="nome-da-empresa"
                    />
                  </div>

                  {/* Brand Identity */}
                  <div className="space-y-6 pb-6 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Identidade da Marca
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      <FieldDisplay
                        label="Tom de Voz"
                        value={userSettings.business.voice_tone}
                        isEditing={isEditingBusiness}
                        inputValue={businessForm.voice_tone}
                        onChange={(v) => setBusinessForm(prev => ({ ...prev, voice_tone: v }))}
                        placeholder="Ex: Profissional e amigável"
                        type="textarea"
                        rows={2}
                      />
                      <FieldDisplay
                        label="Objetivo da Empresa"
                        value={userSettings.business.objective}
                        isEditing={isEditingBusiness}
                        inputValue={businessForm.objective}
                        onChange={(v) => setBusinessForm(prev => ({ ...prev, objective: v }))}
                        placeholder="Descreva o objetivo principal..."
                        type="textarea"
                        rows={3}
                      />
                      <FieldDisplay
                        label="Público-Alvo"
                        value={userSettings.business.target_audience}
                        isEditing={isEditingBusiness}
                        inputValue={businessForm.target_audience}
                        onChange={(v) => setBusinessForm(prev => ({ ...prev, target_audience: v }))}
                        placeholder="Quem é seu público-alvo?"
                        type="textarea"
                        rows={3}
                      />
                      <FieldDisplay
                        label="Posicionamento de Marca"
                        value={userSettings.business.brand_positioning}
                        isEditing={isEditingBusiness}
                        inputValue={businessForm.brand_positioning}
                        onChange={(v) => setBusinessForm(prev => ({ ...prev, brand_positioning: v }))}
                        placeholder="Como você quer ser percebido?"
                        type="textarea"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Content Guidelines */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Diretrizes de Conteúdo
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <TagsField
                        label="Palavras Preferidas"
                        tags={isEditingBusiness ? businessForm.preferred_words : (userSettings.business.preferred_words || userSettings.preferred_words || [])}
                        isEditing={isEditingBusiness}
                        newValue={newPreferredWord}
                        onNewValueChange={setNewPreferredWord}
                        onAdd={handleAddPreferredWord}
                        onRemove={handleRemovePreferredWord}
                        placeholder="Adicionar palavra"
                        color="green"
                      />
                      <TagsField
                        label="Palavras Proibidas"
                        tags={isEditingBusiness ? businessForm.forbidden_words : (userSettings.business.forbidden_words || userSettings.forbidden_words || [])}
                        isEditing={isEditingBusiness}
                        newValue={newForbiddenWord}
                        onNewValueChange={setNewForbiddenWord}
                        onAdd={handleAddForbiddenWord}
                        onRemove={handleRemoveForbiddenWord}
                        placeholder="Adicionar palavra"
                        color="red"
                      />
                      <TagsField
                        label="Tópicos Proibidos"
                        tags={isEditingBusiness ? businessForm.forbidden_topics : (userSettings.business.forbidden_topics || userSettings.forbidden_topics || [])}
                        isEditing={isEditingBusiness}
                        newValue={newForbiddenTopic}
                        onNewValueChange={setNewForbiddenTopic}
                        onAdd={handleAddForbiddenTopic}
                        onRemove={handleRemoveForbiddenTopic}
                        placeholder="Adicionar tópico"
                        color="red"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Influencers Tab */}
              {activeTab === 'influenciadores' && userSettings && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Influenciadores</h2>
                      <p className="text-gray-500 text-sm mt-1">Gerencie suas referências de estilo</p>
                    </div>
                    {!showInfluencerInput && (
                      <button
                        onClick={() => setShowInfluencerInput(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-blue-500 text-white hover:bg-blue-600 transition-all duration-200"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar Influenciador
                      </button>
                    )}
                  </div>

                  {/* Add Form - só aparece quando showInfluencerInput é true */}
                  {showInfluencerInput && (
                    <div className="flex gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <input
                        type="text"
                        value={newInfluencer}
                        onChange={(e) => setNewInfluencer(e.target.value)}
                        placeholder="@usuario do Instagram"
                        className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all duration-200"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddInfluencer()}
                        autoFocus
                      />
                      <button
                        onClick={handleAddInfluencer}
                        disabled={isAddingInfluencer || !newInfluencer.trim()}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm bg-blue-500 text-white hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {isAddingInfluencer ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Adicionar
                      </button>
                      <button
                        onClick={() => { setShowInfluencerInput(false); setNewInfluencer(''); }}
                        className="flex items-center justify-center px-3 py-3 rounded-xl text-gray-500 hover:bg-gray-200 transition-all duration-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Influencers Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {userSettings.influencers.filter(inf => inf.handle || inf.instagram_username).length === 0 && !showInfluencerInput ? (
                      <div className="sm:col-span-2 py-12 text-center">
                        <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600">Nenhum influenciador adicionado ainda</p>
                        <p className="text-gray-400 text-sm mt-1">Adicione referências de estilo para o seu conteúdo</p>
                      </div>
                    ) : (
                      userSettings.influencers.filter(inf => inf.handle || inf.instagram_username).map((influencer) => (
                        <div
                          key={influencer.influencer_id}
                          className="group relative p-4 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-200 to-purple-200 border border-purple-200 flex items-center justify-center text-lg font-semibold text-purple-700">
                              {(influencer.handle || influencer.instagram_username || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <a
                                href={`https://instagram.com/${influencer.handle || influencer.instagram_username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-gray-900 hover:text-blue-500 transition-colors"
                              >
                                @{influencer.handle || influencer.instagram_username}
                              </a>
                            </div>
                            <button
                              onClick={() => handleRemoveInfluencer(influencer.influencer_id)}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 opacity-0 group-hover:opacity-100"
                              title="Remover"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Niches Tab */}
              {activeTab === 'nicho' && userSettings && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Nichos</h2>
                      <p className="text-gray-500 text-sm mt-1">Defina as categorias do seu negócio</p>
                    </div>
                    {!showNicheInput && (
                      <button
                        onClick={() => setShowNicheInput(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-blue-500 text-white hover:bg-blue-600 transition-all duration-200"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar Nicho
                      </button>
                    )}
                  </div>

                  {/* Add Form - só aparece quando showNicheInput é true */}
                  {showNicheInput && (
                    <div className="flex gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <input
                        type="text"
                        value={newNiche}
                        onChange={(e) => setNewNiche(e.target.value)}
                        placeholder="Ex: Marketing Digital"
                        className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all duration-200"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNiche()}
                        autoFocus
                      />
                      <button
                        onClick={handleAddNiche}
                        disabled={isAddingNiche || !newNiche.trim()}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm bg-blue-500 text-white hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAddingNiche ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Adicionar
                      </button>
                      <button
                        onClick={() => { setShowNicheInput(false); setNewNiche(''); }}
                        className="flex items-center justify-center px-3 py-3 rounded-xl text-gray-500 hover:bg-gray-200 transition-all duration-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Niches Tags */}
                  <div className="flex flex-wrap gap-3">
                    {userSettings.niches.length === 0 && !showNicheInput ? (
                      <div className="w-full py-12 text-center">
                        <Target className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600">Nenhum nicho adicionado ainda</p>
                        <p className="text-gray-400 text-sm mt-1">Adicione nichos para categorizar seu negócio</p>
                      </div>
                    ) : (
                      userSettings.niches.map((niche) => (
                        <div
                          key={niche.id}
                          className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-100 border border-blue-200 hover:bg-blue-200 transition-all duration-200"
                        >
                          <span className="text-blue-700 font-medium">{niche.name}</span>
                          <button
                            onClick={() => handleRemoveNiche(niche)}
                            className="p-1 rounded-lg text-blue-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 opacity-0 group-hover:opacity-100"
                            title="Remover"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
