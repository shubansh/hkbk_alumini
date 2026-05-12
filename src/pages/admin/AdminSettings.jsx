import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Settings, Save, Image as ImageIcon, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    logo_url: '/logos/college/logo.png',
    enable_jobs: true,
    enable_events: true,
    enable_mentorship: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);

  const fetchSettings = async () => {
    const { data, error } = await supabase.from('platform_settings').select('*');
    if (!error && data) {
      const formattedSettings = { ...settings };
      data.forEach(item => {
        formattedSettings[item.key] = item.value;
      });
      setSettings(formattedSettings);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    let currentLogoUrl = settings.logo_url;

    // Handle logo upload if new file selected
    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('gallery') // using gallery bucket for simplicity
        .upload(`brand/${fileName}`, file);

      if (uploadError) {
        toast.error('Logo upload failed. Make sure "gallery" bucket exists.');
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('gallery')
          .getPublicUrl(`brand/${fileName}`);
        currentLogoUrl = publicUrl;
      }
    }

    // Save settings to DB
    const updates = [
      { key: 'logo_url', value: currentLogoUrl },
      { key: 'enable_jobs', value: settings.enable_jobs },
      { key: 'enable_events', value: settings.enable_events },
      { key: 'enable_mentorship', value: settings.enable_mentorship }
    ];

    for (const update of updates) {
      await supabase
        .from('platform_settings')
        .upsert({ key: update.key, value: update.value }, { onConflict: 'key' });
    }

    toast.success('Settings saved successfully');
    setFile(null);
    setSettings(prev => ({ ...prev, logo_url: currentLogoUrl }));
    setSaving(false);
  };

  const toggleFeature = (feature) => {
    setSettings(prev => ({ ...prev, [feature]: !prev[feature] }));
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          Platform Settings
        </h1>
        <p className="text-gray-500 mt-1">Manage global platform configurations and branding.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Branding Section */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-3">
            <ImageIcon className="w-5 h-5 text-gray-400" /> Branding
          </h2>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-48 h-24 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg flex items-center justify-center overflow-hidden p-2">
              <img 
                src={file ? URL.createObjectURL(file) : settings.logo_url} 
                alt="Platform Logo" 
                className="max-w-full max-h-full object-contain"
                onError={(e) => { e.target.src = '/logos/college/logo.png' }}
              />
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Update Platform Logo</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400 cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-2">Recommended: PNG or SVG with transparent background, 400x100px.</p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-3">
            <Settings className="w-5 h-5 text-gray-400" /> Feature Toggles
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-700/30 rounded-lg transition-colors">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Jobs Board</h3>
                <p className="text-sm text-gray-500">Allow users to post and view job opportunities.</p>
              </div>
              <button type="button" onClick={() => toggleFeature('enable_jobs')} className="text-blue-600 dark:text-blue-400">
                {settings.enable_jobs ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10 text-gray-400" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-700/30 rounded-lg transition-colors">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Events System</h3>
                <p className="text-sm text-gray-500">Enable the upcoming events and reunions directory.</p>
              </div>
              <button type="button" onClick={() => toggleFeature('enable_events')} className="text-blue-600 dark:text-blue-400">
                {settings.enable_events ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10 text-gray-400" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-700/30 rounded-lg transition-colors">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Mentorship Program</h3>
                <p className="text-sm text-gray-500">Allow alumni to offer mentorship to students.</p>
              </div>
              <button type="button" onClick={() => toggleFeature('enable_mentorship')} className="text-blue-600 dark:text-blue-400">
                {settings.enable_mentorship ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10 text-gray-400" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
