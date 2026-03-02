import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ExternalLink,
  Github,
  Palette,
  FileText,
  Link as LinkIcon,
  BookOpen,
  Layers,
  Figma,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { useTeam } from '../contexts/TeamContext';
import { db } from '../firebase';
import { sanitizeText, sanitizeURL, sanitizeObject, updateHackathonLimiter } from '../utils/security';

const parseAddedAt = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const formatAddedAt = (value) => {
  const date = parseAddedAt(value);
  if (!date) return 'Date unknown';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getResourceIcon = (type) => {
  const normalized = String(type || '').toLowerCase();

  if (normalized.includes('github')) {
    return { Icon: Github, wrapper: 'bg-gray-800 text-white border-gray-600' };
  }
  if (normalized.includes('canva')) {
    return { Icon: Palette, wrapper: 'bg-purple-500/20 text-purple-300 border-purple-400/30' };
  }
  if (normalized.includes('figma')) {
    return { Icon: Figma, wrapper: 'bg-pink-500/20 text-pink-300 border-pink-400/30' };
  }
  if (normalized.includes('doc') || normalized.includes('notion') || normalized.includes('ppt')) {
    return { Icon: FileText, wrapper: 'bg-blue-500/20 text-blue-300 border-blue-400/30' };
  }

  return { Icon: LinkIcon, wrapper: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30' };
};

const getReadableFirestoreError = (listenerError) => {
  const code = listenerError?.code || '';
  if (code === 'permission-denied') {
    return 'Missing or insufficient permissions for hackathon resource reads. Update Firestore Rules to allow authenticated access to the filtered hackathons scope (solo/team).';
  }
  return listenerError?.message || 'Something went wrong while loading resources.';
};

const sortPills = [
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'project', label: 'By Project' },
  { id: 'type', label: 'By Type' }
];

function ResourcesPage() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { currentTeam } = useTeam();

  const initialFormState = {
    projectId: '',
    label: '',
    url: '',
    type: 'Other'
  };

  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState('newest');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [copiedResourceId, setCopiedResourceId] = useState('');
  const [flashResourceId, setFlashResourceId] = useState('');

  useEffect(() => {
    if (!currentUser) {
      setHackathons([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const hackathonsRef = collection(db, 'hackathons');
    const hackathonsQuery = currentTeam
      ? query(hackathonsRef, where('teamId', '==', currentTeam.id))
      : query(hackathonsRef, where('ownerId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(
      hackathonsQuery,
      (snapshot) => {
        try {
          const items = snapshot.docs
            .map((entry) => ({ id: entry.id, ...entry.data() }))
            .filter((item) => {
              if (currentTeam) return item.teamId === currentTeam.id;
              return !item.teamId;
            });

          setHackathons(items);
          setLoading(false);
        } catch (processingError) {
          setError(processingError.message);
          setLoading(false);
        }
      },
      (listenerError) => {
        setError(getReadableFirestoreError(listenerError));
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser, currentTeam]);

  const flattenedResources = useMemo(() => {
    return hackathons.flatMap((hackathon) => {
      const resources = Array.isArray(hackathon.resources) ? hackathon.resources : [];

      return resources.map((resource, index) => ({
        id: `${hackathon.id}-${resource.id || index}`,
        label: sanitizeText(resource.label || resource.title || 'Untitled Resource'),
        url: sanitizeURL(resource.url || resource.link || ''),
        type: sanitizeText(resource.type || 'Link'),
        addedAt: resource.addedAt || null,
        parentHackathonTitle: sanitizeText(hackathon.title || 'Untitled Project'),
        parentHackathonId: hackathon.id
      }));
    });
  }, [hackathons]);

  const filteredResources = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return flattenedResources;

    return flattenedResources.filter((resource) => {
      const haystack = [resource.label, resource.url, resource.type, resource.parentHackathonTitle].join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }, [flattenedResources, searchTerm]);

  const sortedResources = useMemo(() => {
    const list = [...filteredResources];

    if (sortMode === 'oldest') {
      list.sort((a, b) => {
        const aTime = parseAddedAt(a.addedAt)?.getTime() || 0;
        const bTime = parseAddedAt(b.addedAt)?.getTime() || 0;
        return aTime - bTime;
      });
      return list;
    }

    if (sortMode === 'newest') {
      list.sort((a, b) => {
        const aTime = parseAddedAt(a.addedAt)?.getTime() || 0;
        const bTime = parseAddedAt(b.addedAt)?.getTime() || 0;
        return bTime - aTime;
      });
      return list;
    }

    if (sortMode === 'project') {
      list.sort((a, b) => a.parentHackathonTitle.localeCompare(b.parentHackathonTitle));
      return list;
    }

    list.sort((a, b) => a.type.localeCompare(b.type));
    return list;
  }, [filteredResources, sortMode]);

  const groupedResources = useMemo(() => {
    if (sortMode !== 'project' && sortMode !== 'type') return null;

    const groups = new Map();
    const groupKey = sortMode === 'project' ? 'parentHackathonTitle' : 'type';

    sortedResources.forEach((resource) => {
      const key = resource[groupKey] || 'Other';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(resource);
    });

    return Array.from(groups.entries());
  }, [sortedResources, sortMode]);

  useEffect(() => {
    if (!successToast) return undefined;
    const timer = setTimeout(() => setSuccessToast(''), 3000);
    return () => clearTimeout(timer);
  }, [successToast]);

  useEffect(() => {
    if (!copiedResourceId) return undefined;
    const timer = setTimeout(() => setCopiedResourceId(''), 2000);
    return () => clearTimeout(timer);
  }, [copiedResourceId]);

  useEffect(() => {
    if (!flashResourceId) return undefined;
    const timer = setTimeout(() => setFlashResourceId(''), 1000);
    return () => clearTimeout(timer);
  }, [flashResourceId]);

  const resetAddForm = () => {
    setFormData(initialFormState);
    setFieldErrors({});
    setSubmitError('');
    setIsSubmitting(false);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    resetAddForm();
  };

  const openAddModal = () => {
    setIsAddModalOpen(true);
    setSubmitError('');
    setFieldErrors({});
  };

  const validateForm = () => {
    const validationErrors = {};
    const trimmedLabel = formData.label.trim();
    const trimmedUrl = formData.url.trim();

    if (!formData.projectId) validationErrors.projectId = 'Please select a project.';
    if (!trimmedLabel) validationErrors.label = 'Label is required.';
    else if (trimmedLabel.length > 100) validationErrors.label = 'Label must be at most 100 characters.';

    if (!trimmedUrl) validationErrors.url = 'URL is required.';
    else if (!/^https?:\/\/.+/i.test(trimmedUrl)) validationErrors.url = 'Please enter a valid URL starting with https://';

    if (!formData.type) validationErrors.type = 'Type is required.';

    return validationErrors;
  };

  const handleAddResource = async (event) => {
    event.preventDefault();

    const validationErrors = validateForm();
    setFieldErrors(validationErrors);
    setSubmitError('');

    if (Object.keys(validationErrors).length > 0) return;

    if (!updateHackathonLimiter.canProceed('resource-add-resources-page')) {
      setSubmitError('Too many update requests. Please wait and try again.');
      return;
    }

    const selectedHackathon = hackathons.find((hackathon) => hackathon.id === formData.projectId);
    if (!selectedHackathon) {
      setSubmitError('Selected project could not be found.');
      return;
    }

    const sanitizedLabel = sanitizeText(formData.label.trim()).slice(0, 100);
    const sanitizedUrl = sanitizeURL(formData.url.trim());

    if (!/^https?:\/\/.+/i.test(sanitizedUrl)) {
      setFieldErrors((previous) => ({ ...previous, url: 'Please enter a valid URL starting with https://' }));
      return;
    }

    const sanitizedResource = sanitizeObject(
      {
        label: sanitizedLabel,
        url: sanitizedUrl,
        type: formData.type,
        addedAt: new Date().toISOString()
      },
      ['label', 'url', 'type', 'addedAt']
    );

    setIsSubmitting(true);

    try {
      await updateDoc(doc(db, 'hackathons', formData.projectId), {
        resources: arrayUnion(sanitizedResource),
        updatedAt: serverTimestamp()
      });

      setSuccessToast(`Resource added to ${selectedHackathon.title} ✓`);
      closeAddModal();
    } catch (submitFirestoreError) {
      console.error('Failed to add resource:', submitFirestoreError);
      setSubmitError('Failed to add resource. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCopyResource = async (resource) => {
    try {
      await navigator.clipboard.writeText(resource.url || '');
      setCopiedResourceId(resource.id);
      setFlashResourceId(resource.id);
    } catch (copyError) {
      console.error('Failed to copy resource:', copyError);
    }
  };

  const ResourceCard = ({ resource }) => {
    const { Icon, wrapper } = getResourceIcon(resource.type);
    const copied = copiedResourceId === resource.id;

    return (
      <motion.div
        layout
        className={`rounded-2xl border backdrop-blur-xl p-3 md:p-4 shadow-lg transition-all ${flashResourceId === resource.id
          ? 'bg-emerald-500/10 border-emerald-400/40 shadow-[0_0_24px_rgba(16,185,129,0.28)]'
          : 'bg-black/30 border-white/10'
          }`}
      >
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl border flex items-center justify-center shrink-0 ${wrapper}`}>
            <Icon size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-white truncate">{resource.label}</p>
              <span className="text-[10px] md:text-xs text-gray-400 whitespace-nowrap">{formatAddedAt(resource.addedAt)}</span>
            </div>
            <p className="text-[11px] md:text-sm text-gray-400 truncate mt-0.5">{resource.url || 'Invalid URL'}</p>
            <p className="mt-1 inline-flex text-[10px] md:text-xs text-gray-300 bg-white/5 border border-white/10 rounded-full px-2 py-0.5 max-w-full truncate">
              {resource.parentHackathonTitle}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => handleCopyResource(resource)}
            className={`min-h-[44px] rounded-lg border px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 ${copied
              ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
              : 'border-indigo-400/30 bg-indigo-500/10 text-indigo-200'
              }`}
          >
            {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
          </motion.button>
          <motion.a
            whileTap={{ scale: 0.96 }}
            href={resource.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-200"
            onClick={(event) => {
              if (!resource.url) event.preventDefault();
            }}
          >
            Open <ExternalLink size={14} />
          </motion.a>
        </div>
      </motion.div>
    );
  };

  return (
    <DashboardLayout
      user={currentUser}
      currentTeam={currentTeam}
      onLogout={logout}
      onAddClick={() => navigate('/')}
      onTeamClick={() => navigate('/teams')}
    >
      <div className="mx-auto max-w-[900px] space-y-4 md:space-y-5">
        <AnimatePresence>
          {successToast && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="fixed top-16 md:top-6 right-4 md:right-6 z-[120] rounded-xl border border-emerald-400/30 bg-emerald-500/15 text-emerald-200 px-4 py-3 shadow-lg backdrop-blur-xl flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              <span className="text-xs md:text-sm font-medium">{successToast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <BookOpen className="text-indigo-400" size={18} />
          <div>
            <h1 className="text-xl md:text-3xl font-heading font-bold text-white tracking-tight">Resources Library</h1>
            <p className="text-xs md:text-sm text-gray-400">Search and browse all resources across your projects</p>
          </div>
        </motion.div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 md:p-4 text-red-300 text-xs md:text-sm">
            {error}
          </div>
        )}

        <div className="sticky top-0 z-20 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-2xl p-3 md:p-4 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search resources by label, URL, type, or project..."
              className="w-full rounded-xl border border-white/10 bg-black/30 pl-10 pr-4 py-2.5 text-xs md:text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:hidden overflow-x-auto no-scrollbar">
            <div className="flex gap-2 min-w-max">
              {sortPills.map((pill) => (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  key={pill.id}
                  onClick={() => setSortMode(pill.id)}
                  className={`min-h-[36px] px-3 rounded-full border text-xs ${sortMode === pill.id
                    ? 'border-indigo-400/40 bg-indigo-500/15 text-indigo-200'
                    : 'border-white/10 bg-white/5 text-white/60'
                    }`}
                >
                  {pill.label}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="hidden md:grid grid-cols-[220px_auto] gap-3 items-center">
            <div className="relative">
              <Layers size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="project">By Project</option>
                <option value="type">By Type</option>
              </select>
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-white font-semibold shadow-lg shadow-indigo-500/30"
            >
              <Plus size={16} />
              Add Resource
            </motion.button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((entry) => (
              <div key={entry} className="h-[98px] rounded-2xl border border-white/10 bg-white/5 overflow-hidden relative">
                <div className="absolute inset-0 shimmer" />
              </div>
            ))}
          </div>
        ) : sortedResources.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-12 text-center text-gray-400">
            <div className="text-6xl mb-3">🔗</div>
            <p className="text-xs md:text-sm">{searchTerm.trim() ? 'No resources match your search.' : 'No resources found across your projects yet. Add some from the Dashboard! ✦'}</p>
          </div>
        ) : groupedResources ? (
          <div className="space-y-5 md:space-y-8">
            {groupedResources.map(([groupTitle, resources]) => (
              <section key={groupTitle} className="space-y-2 md:space-y-3">
                <div className="sticky top-[102px] md:top-[86px] z-10 inline-flex rounded-full border border-white/10 bg-gray-900/80 px-3 py-1 text-[10px] md:text-xs text-gray-300">
                  {sortMode === 'project' ? `Project: ${groupTitle}` : `Type: ${groupTitle}`}
                </div>
                <motion.div layout className="space-y-2 md:space-y-3">
                  {resources.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}
                </motion.div>
              </section>
            ))}
          </div>
        ) : (
          <motion.div layout className="space-y-2 md:space-y-3">
            {sortedResources.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}
          </motion.div>
        )}
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={openAddModal}
        className="md:hidden fixed z-40 right-4 bottom-[80px] h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-[0_10px_30px_rgba(99,102,241,0.35)] flex items-center justify-center"
      >
        <Plus size={24} />
      </motion.button>

      <AnimatePresence>
        {isAddModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm"
              onClick={closeAddModal}
            />

            <motion.form
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              onSubmit={handleAddResource}
              className="fixed z-[120] md:z-[110] inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center rounded-t-3xl md:rounded-none border border-white/10 md:border-0 bg-gray-900/95 md:bg-transparent p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]"
            >
              <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-gray-900/95 p-4 md:p-6 shadow-2xl backdrop-blur-2xl">
                <div className="md:hidden mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-lg md:text-2xl font-heading font-bold text-white">Add New Resource</h2>
                    <p className="text-xs md:text-sm text-gray-400 mt-1">This resource will be saved to the selected project.</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={closeAddModal}
                    className="min-h-[44px] min-w-[44px] p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    <X size={16} />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1">Select Project</label>
                    <select
                      value={formData.projectId}
                      onChange={(event) => setFormData((previous) => ({ ...previous, projectId: event.target.value }))}
                      disabled={hackathons.length === 0}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                    >
                      {hackathons.length === 0 ? (
                        <option value="">No projects found — create one from Dashboard first.</option>
                      ) : (
                        <>
                          <option value="">Choose a project</option>
                          {hackathons.map((hackathon) => (
                            <option key={hackathon.id} value={hackathon.id}>{hackathon.title || 'Untitled Project'}</option>
                          ))}
                        </>
                      )}
                    </select>
                    {fieldErrors.projectId && <p className="mt-1 text-xs md:text-sm text-red-400">{fieldErrors.projectId}</p>}
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1">Label</label>
                    <input
                      type="text"
                      maxLength={100}
                      value={formData.label}
                      onChange={(event) => setFormData((previous) => ({ ...previous, label: event.target.value }))}
                      placeholder="e.g. Design Mockup, API Docs, GitHub Repo"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {fieldErrors.label && <p className="mt-1 text-xs md:text-sm text-red-400">{fieldErrors.label}</p>}
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1">URL</label>
                    <input
                      type="text"
                      value={formData.url}
                      onChange={(event) => setFormData((previous) => ({ ...previous, url: event.target.value }))}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {fieldErrors.url && <p className="mt-1 text-xs md:text-sm text-red-400">{fieldErrors.url}</p>}
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={(event) => setFormData((previous) => ({ ...previous, type: event.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option>GitHub</option>
                      <option>Figma</option>
                      <option>Canva</option>
                      <option>Google Docs</option>
                      <option>Notion</option>
                      <option>Vercel</option>
                      <option>YouTube</option>
                      <option>Slides</option>
                      <option>Other</option>
                    </select>
                    {fieldErrors.type && <p className="mt-1 text-xs md:text-sm text-red-400">{fieldErrors.type}</p>}
                  </div>

                  {submitError && (
                    <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs md:text-sm text-red-300">
                      {submitError}
                    </div>
                  )}

                  <div className="pt-2 space-y-2">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      type="submit"
                      disabled={isSubmitting || hackathons.length === 0}
                      className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-white text-sm font-semibold disabled:opacity-60"
                    >
                      {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                      Add Resource
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      type="button"
                      onClick={closeAddModal}
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 text-sm"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.form>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

export default ResourcesPage;
