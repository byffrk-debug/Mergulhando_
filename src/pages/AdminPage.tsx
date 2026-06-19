import React, { useState } from 'react';
import { Plus, Trash2, BookOpen, Megaphone, Users, FileText, ChevronDown, ChevronUp, Home } from 'lucide-react';
import { CoverUpload } from '../components/CoverUpload';
import { useHomeConfig } from '../hooks/useHomeConfig';
import { motion, AnimatePresence } from 'motion/react';
import { useTracks } from '../hooks/useTracks';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { QuizManager } from '../components/quiz/QuizManager';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import type { Video, AppView, UserRole } from '../types';

interface AdminPageProps {
  videos: Video[];
  role: UserRole;
  onVideosChange: () => void;
  onNavigate: (view: AppView) => void;
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-6 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-cyan-400" />
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-5 pt-0 border-t border-gray-800">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AdminPage({ videos, role, onVideosChange, onNavigate }: AdminPageProps) {
  const { tracks, trackModules, addTrack, updateTrack, deleteTrack, addModuleToTrack, removeModuleFromTrack, getTrackModules } = useTracks();
  const { announcements, addAnnouncement, deleteAnnouncement } = useAnnouncements();
  const { config: homeConfig, updateConfig: updateHomeConfig } = useHomeConfig();

  // Home config form
  const [homeBanner, setHomeBanner] = useState('');
  const [homeVideoUrl, setHomeVideoUrl] = useState('');
  const [homeVideoTitle, setHomeVideoTitle] = useState('');
  const [savingHome, setSavingHome] = useState(false);

  // Video form
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newModule, setNewModule] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newThumbnail, setNewThumbnail] = useState('');

  // Track form
  const [trackName, setTrackName] = useState('');
  const [trackDesc, setTrackDesc] = useState('');
  const [trackThumbnail, setTrackThumbnail] = useState('');
  const [trackBanner, setTrackBanner] = useState('');

  // Announcement form
  const [annContent, setAnnContent] = useState('');
  const [annIcon, setAnnIcon] = useState('megaphone');
  const [annLink, setAnnLink] = useState('');
  const [annLinkLabel, setAnnLinkLabel] = useState('');

  const modules = Array.from(new Set(videos.map(v => v.module)));

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim() || !newModule.trim()) return;
    try { new URL(newUrl); } catch { toast.error('URL inválida.'); return; }
    const { data, error } = await supabase.from('videos').insert([{
      title: newTitle, url: newUrl, module: newModule,
      content: newContent || null, short_description: newDescription || null,
      thumbnail_url: newThumbnail || null,
    }]).select();
    if (error) { toast.error('Erro: ' + error.message); return; }
    if (data) {
      toast.success('Aula adicionada!');
      setNewTitle(''); setNewUrl(''); setNewContent(''); setNewDescription(''); setNewThumbnail('');
      onVideosChange();
    }
  };

  const handleDeleteVideo = async (id: string) => {
    toast('Excluir esta aula?', {
      action: { label: 'Excluir', onClick: async () => {
        const { error } = await supabase.from('videos').delete().eq('id', id);
        if (error) toast.error(error.message);
        else { toast.success('Aula excluída!'); onVideosChange(); }
      }},
      cancel: { label: 'Cancelar', onClick: () => {} },
    });
  };

  const handleAddTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackName.trim()) return;
    const result = await addTrack({
      name: trackName,
      description: trackDesc || undefined,
      thumbnail_url: trackThumbnail || undefined,
      banner_url: trackBanner || undefined,
      order_index: tracks.length,
    });
    if (result) {
      setTrackName(''); setTrackDesc(''); setTrackThumbnail(''); setTrackBanner('');
      toast.success('Trilha criada!');
    } else {
      toast.error('Erro ao criar trilha. Verifique as permissões no Supabase.');
    }
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annContent.trim()) return;
    await addAnnouncement({ content: annContent, icon: annIcon, link_url: annLink || undefined, link_label: annLinkLabel || undefined, order_index: announcements.length, active: true });
    setAnnContent(''); setAnnLink(''); setAnnLinkLabel('');
    toast.success('Aviso adicionado!');
  };

  const handleSaveHomeConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHome(true);
    const patch: Record<string, string> = {};
    if (homeBanner.trim()) patch.banner_image_url = homeBanner.trim();
    if (homeVideoUrl.trim()) patch.welcome_video_url = homeVideoUrl.trim();
    if (homeVideoTitle.trim()) patch.welcome_video_title = homeVideoTitle.trim();
    const err = await updateHomeConfig(patch);
    setSavingHome(false);
    if (err) { toast.error('Erro ao salvar: ' + err.message); return; }
    toast.success('Configurações da Home salvas!');
    setHomeBanner(''); setHomeVideoUrl(''); setHomeVideoTitle('');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Painel Administrativo</h1>

      {/* Home config */}
      <Section title="Configurar Início" icon={Home}>
        <form onSubmit={handleSaveHomeConfig} className="space-y-4 pt-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">URL do Banner (imagem fixa)</label>
            <input
              value={homeBanner}
              onChange={e => setHomeBanner(e.target.value)}
              placeholder={homeConfig.banner_image_url ?? 'https://...imagem.jpg'}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-cyan-500 text-sm"
            />
            {homeConfig.banner_image_url && (
              <p className="text-xs text-gray-500 mt-1 truncate">Atual: {homeConfig.banner_image_url}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">URL do Vídeo de Boas-Vindas (YouTube)</label>
            <input
              value={homeVideoUrl}
              onChange={e => setHomeVideoUrl(e.target.value)}
              placeholder={homeConfig.welcome_video_url ?? 'https://youtube.com/watch?v=...'}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-cyan-500 text-sm"
            />
            {homeConfig.welcome_video_url && (
              <p className="text-xs text-gray-500 mt-1 truncate">Atual: {homeConfig.welcome_video_url}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Título do Vídeo de Boas-Vindas</label>
            <input
              value={homeVideoTitle}
              onChange={e => setHomeVideoTitle(e.target.value)}
              placeholder={homeConfig.welcome_video_title ?? 'Bem-vindo ao Mergulhando na Palavra'}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-cyan-500 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={savingHome || (!homeBanner.trim() && !homeVideoUrl.trim() && !homeVideoTitle.trim())}
            className="px-5 py-2 bg-cyan-500 text-gray-950 font-medium rounded-xl hover:bg-cyan-400 transition-colors disabled:opacity-50 text-sm"
          >
            {savingHome ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </form>
      </Section>

      {/* Add Video */}
      <Section title="Adicionar Aula" icon={FileText}>
        <form onSubmit={handleAddVideo} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Módulo *</label>
              <input value={newModule} onChange={e => setNewModule(e.target.value)} required placeholder="Ex: Módulo 1"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-cyan-500 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Título *</label>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-cyan-500 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">URL YouTube *</label>
              <input value={newUrl} onChange={e => setNewUrl(e.target.value)} required type="url"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-pink-500 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Descrição curta</label>
            <input value={newDescription} onChange={e => setNewDescription(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-cyan-500 text-sm"
              placeholder="Resumo em 1-2 frases" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Material complementar (Markdown)</label>
            <textarea value={newContent} onChange={e => setNewContent(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-cyan-500 text-sm min-h-[80px] resize-y font-mono"
              placeholder="Conteúdo em Markdown..." />
          </div>
          <CoverUpload
            value={newThumbnail}
            onChange={setNewThumbnail}
            folder="videos"
            aspect="16/9"
            previewWidthClass="w-44"
            label="Capa da Aula (16:9 — 1280×720)"
          />
          <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 text-gray-950 font-medium rounded-xl hover:bg-cyan-400 transition-colors">
            <Plus className="w-4 h-4" /> Adicionar Aula
          </button>
        </form>

        {/* Video list */}
        {videos.length > 0 && (
          <div className="mt-6 space-y-2">
            <h4 className="text-xs text-gray-500 uppercase tracking-wide">Aulas cadastradas ({videos.length})</h4>
            {videos.map(v => (
              <div key={v.id} className="flex items-center justify-between gap-3 p-3 bg-gray-800 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{v.title}</p>
                  <p className="text-xs text-gray-500">{v.module}</p>
                </div>
                <button onClick={() => handleDeleteVideo(v.id)} className="text-gray-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Quiz Manager */}
      <Section title="Gerenciar Quizzes" icon={FileText}>
        <div className="pt-4 space-y-3">
          {modules.length === 0 ? (
            <p className="text-sm text-gray-500">Adicione aulas primeiro para criar quizzes.</p>
          ) : (
            modules.map(mod => (
              <QuizManager key={mod} moduleName={mod} moduleVideos={videos.filter(v => v.module === mod)} />
            ))
          )}
        </div>
      </Section>

      {/* Tracks */}
      <Section title="Trilhas de Aprendizado" icon={BookOpen}>
        <form onSubmit={handleAddTrack} className="space-y-3 pt-4 mb-4">
          <div className="flex gap-3">
            <input value={trackName} onChange={e => setTrackName(e.target.value)} required placeholder="Nome da trilha"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-cyan-500 text-sm" />
            <input value={trackDesc} onChange={e => setTrackDesc(e.target.value)} placeholder="Descrição (opcional)"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-cyan-500 text-sm" />
          </div>
          <CoverUpload
            value={trackThumbnail}
            onChange={setTrackThumbnail}
            folder="tracks"
            label="Capa da Trilha (9:16 — retrato, aparece na lista de trilhas)"
          />
          <CoverUpload
            value={trackBanner}
            onChange={setTrackBanner}
            folder="tracks-banner"
            aspect="16/6"
            previewWidthClass="w-44"
            label="Banner de Topo (1600×600px — aparece ao abrir a trilha)"
          />
          <button type="submit" className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-gray-950 rounded-xl hover:bg-cyan-400 transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /> Criar Trilha
          </button>
        </form>

        <div className="space-y-3">
          {tracks.map(track => {
            const tms = getTrackModules(track.id);
            return (
              <div key={track.id} className="p-4 bg-gray-800 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white">{track.name}</h4>
                  <button onClick={() => deleteTrack(track.id)} className="text-gray-500 hover:text-red-400 p-1 rounded transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {/* Modules in track */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {tms.map(tm => (
                    <span key={tm.module_name} className="flex items-center gap-1 text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-lg">
                      {tm.module_name}
                      <button onClick={() => removeModuleFromTrack(track.id, tm.module_name)} className="text-gray-500 hover:text-red-400 ml-1">×</button>
                    </span>
                  ))}
                </div>
                {/* Capa da trilha (9:16 — lista de trilhas) */}
                <div className="mb-3">
                  <TrackCoverEditor
                    initial={track.thumbnail_url ?? ''}
                    label="Capa desta Trilha (9:16 — aparece na lista)"
                    onSave={async (url) => {
                      const ok = await updateTrack(track.id, { thumbnail_url: url || undefined });
                      if (ok) toast.success('Capa da trilha atualizada!');
                      else toast.error('Erro ao salvar capa.');
                    }}
                  />
                </div>

                {/* Banner de topo (paisagem — ao abrir a trilha) */}
                <div className="mb-3">
                  <TrackCoverEditor
                    initial={track.banner_url ?? ''}
                    label="Banner de Topo (1600×600px — aparece ao abrir a trilha)"
                    folder="tracks-banner"
                    aspect="16/6"
                    previewWidthClass="w-44"
                    saveLabel="Salvar banner"
                    onSave={async (url) => {
                      const ok = await updateTrack(track.id, { banner_url: url || undefined });
                      if (ok) toast.success('Banner da trilha atualizado!');
                      else toast.error('Erro ao salvar banner.');
                    }}
                  />
                </div>

                {/* Add module — só módulos que NÃO estão em nenhuma trilha (exclusividade) */}
                {(() => {
                  // Módulos já usados em qualquer trilha (qualquer track_id)
                  const usedModules = new Set(trackModules.map(tm => tm.module_name));
                  const available = modules.filter(m => !usedModules.has(m));
                  return (
                    <>
                      <select
                        onChange={e => { if (e.target.value) { addModuleToTrack(track.id, e.target.value, tms.length); e.target.value = ''; }}}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-cyan-500 disabled:opacity-50"
                        disabled={available.length === 0}
                      >
                        <option value="">
                          {available.length === 0 ? 'Nenhum módulo disponível' : '+ Adicionar módulo à trilha...'}
                        </option>
                        {available.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <p className="text-[11px] text-gray-500 mt-1.5">
                        Cada módulo pertence a apenas uma trilha. Para movê-lo, remova-o da trilha atual primeiro.
                      </p>
                    </>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Announcements */}
      <Section title="Avisos da Home" icon={Megaphone}>
        <form onSubmit={handleAddAnnouncement} className="space-y-3 pt-4">
          <div className="flex gap-3">
            <select value={annIcon} onChange={e => setAnnIcon(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500 text-sm">
              <option value="megaphone">📢 Megafone</option>
              <option value="alert-triangle">⚠️ Aviso</option>
              <option value="handshake">🤝 Apoio</option>
            </select>
            <input value={annLinkLabel} onChange={e => setAnnLinkLabel(e.target.value)} placeholder="Rótulo do link"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500 text-sm" />
            <input value={annLink} onChange={e => setAnnLink(e.target.value)} placeholder="URL (opcional)"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500 text-sm" />
          </div>
          <div className="flex gap-3">
            <input value={annContent} onChange={e => setAnnContent(e.target.value)} required placeholder="Texto do aviso"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500 text-sm" />
            <button type="submit" className="px-4 py-2 bg-cyan-500 text-gray-950 rounded-xl hover:bg-cyan-400 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </form>
        <div className="mt-4 space-y-2">
          {announcements.map(ann => (
            <div key={ann.id} className="flex items-center justify-between gap-3 p-3 bg-gray-800 rounded-xl">
              <p className="text-sm text-gray-300 flex-1">{ann.content}</p>
              <button onClick={() => deleteAnnouncement(ann.id)} className="text-gray-600 hover:text-red-400 p-1 rounded transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* User Roles (admin only) */}
      {role === 'admin' && (
        <Section title="Papéis de Usuário" icon={Users}>
          <div className="pt-4">
            <p className="text-sm text-gray-400 mb-4">Promova alunos a moderador inserindo o ID do usuário. O ID pode ser obtido em Authentication → Users no Supabase.</p>
            <PromoteUser />
          </div>
        </Section>
      )}
    </div>
  );
}

function TrackCoverEditor({ initial, onSave, label, folder = 'tracks', aspect = '9/16', previewWidthClass = 'w-24', saveLabel = 'Salvar capa' }: {
  initial: string;
  onSave: (url: string) => Promise<void>;
  label: string;
  folder?: string;
  aspect?: string;
  previewWidthClass?: string;
  saveLabel?: string;
}) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const dirty = value !== initial;

  const handleSave = async () => {
    setSaving(true);
    await onSave(value);
    setSaving(false);
  };

  return (
    <div className="space-y-2">
      <CoverUpload
        value={value}
        onChange={setValue}
        folder={folder}
        aspect={aspect}
        previewWidthClass={previewWidthClass}
        label={label}
      />
      {dirty && (
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 bg-cyan-500 text-gray-950 rounded-lg hover:bg-cyan-400 transition-colors text-xs font-medium disabled:opacity-50"
        >
          {saving ? 'Salvando...' : saveLabel}
        </button>
      )}
    </div>
  );
}

function PromoteUser() {
  const [userId, setUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'moderator' | 'admin'>('moderator');

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) return;
    const { error } = await supabase.from('user_roles').upsert([{ user_id: userId.trim(), role: selectedRole }]);
    if (error) toast.error(error.message);
    else { toast.success('Papel atualizado!'); setUserId(''); }
  };

  return (
    <form onSubmit={handlePromote} className="flex gap-3">
      <input value={userId} onChange={e => setUserId(e.target.value)} required placeholder="UUID do usuário"
        className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500 text-sm font-mono" />
      <select value={selectedRole} onChange={e => setSelectedRole(e.target.value as 'moderator' | 'admin')}
        className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500 text-sm">
        <option value="moderator">Moderador</option>
        <option value="admin">Admin</option>
      </select>
      <button type="submit" className="px-4 py-2 bg-cyan-500 text-gray-950 rounded-xl hover:bg-cyan-400 transition-colors text-sm font-medium">
        Promover
      </button>
    </form>
  );
}
