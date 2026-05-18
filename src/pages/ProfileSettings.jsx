import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import ProfileAvatar from '../components/ProfileAvatar';
import { Save, User, Link as LinkIcon, Edit3, FileText, Upload, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ProfileSettings() {
  const { userProfile, session, refetchProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    company: '',
    job_title: '',
    location: '',
  });
  const [saving, setSaving] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || '',
        bio: userProfile.bio || '',
        company: userProfile.company || '',
        job_title: userProfile.job_title || '',
        location: userProfile.location || '',
        resume_url: userProfile.resume_url || '',
      });
    }
  }, [userProfile]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!session?.user?.id) return;
    setSaving(true);
    
    const { error } = await supabase
      .from('profiles')
      .update(formData)
      .eq('id', session.user.id);

    if (error) {
      toast.error('Failed to update profile: ' + error.message);
    } else {
      toast.success('Profile updated successfully!');
      refetchProfile();
    }
    setSaving(false);
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !session?.user?.id) return;
    
    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only PDF, DOC, and DOCX are allowed.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Resume must be under 5MB.');
      return;
    }

    setResumeUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${session.user.id}/resume_${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      const resumeUrl = publicUrlData.publicUrl;

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ resume_url: resumeUrl })
        .eq('id', session.user.id);

      if (dbError) throw dbError;

      toast.success('Resume uploaded successfully!');
      refetchProfile();
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload resume.');
    } finally {
      setResumeUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-xl p-8 sm:p-10 flex flex-col md:flex-row items-center gap-8">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <ProfileAvatar 
            userId={session?.user?.id}
            url={userProfile?.avatar_url}
            name={userProfile?.full_name}
            size="xl"
            onUpload={() => refetchProfile()}
          />
        </div>

        <div className="flex-1 text-center md:text-left relative z-10">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Profile Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">Update your personal information and dashboard preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Forms */}
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-gray-100 dark:border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-800 pb-4 mb-6">
              <User className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Personal Information</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input 
                  type="text" name="full_name"
                  value={formData.full_name} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                <textarea 
                  name="bio" rows="4"
                  value={formData.bio} onChange={handleChange}
                  placeholder="Tell us a little about yourself..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Company / Organization</label>
                  <input 
                    type="text" name="company"
                    value={formData.company} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Job Title / Role</label>
                  <input 
                    type="text" name="job_title"
                    value={formData.job_title} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Location</label>
                <input 
                  type="text" name="location"
                  value={formData.location} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex justify-end">
              <button 
                type="submit" disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Preferences */}
        <div className="space-y-8">
          
          {/* Resume Upload (Students & Alumni) */}
          {(userProfile?.role === 'student' || userProfile?.role === 'alumni') && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-gray-100 dark:border-slate-800 shadow-xl">
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-800 pb-4 mb-6">
                <FileText className="w-6 h-6 text-emerald-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Resume</h2>
              </div>
              
              <div className="space-y-4">
                {formData.resume_url && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                    <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Resume Active</span>
                    <a href={formData.resume_url} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
                      View
                    </a>
                  </div>
                )}
                <div className="relative">
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx" 
                    onChange={handleResumeUpload}
                    disabled={resumeUploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-colors ${resumeUploading ? 'border-gray-300 bg-gray-50' : 'border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/10'}`}>
                    {resumeUploading ? (
                      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
                    ) : (
                      <Upload className="w-8 h-8 text-emerald-500 mb-2" />
                    )}
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {resumeUploading ? 'Uploading...' : 'Click to upload replace resume'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX (Max 5MB)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Theme Preferences */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-gray-100 dark:border-slate-800 shadow-xl">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-800 pb-4 mb-6">
              <Edit3 className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Theme</h2>
            </div>
            
            <div className="space-y-3">
              {[
                { id: 'light', name: 'Light Mode' },
                { id: 'dark', name: 'Dark Mode' },
                { id: 'midnight', name: 'Midnight Blue' },
                { id: 'glassmorphism', name: 'Glassmorphism' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border font-semibold transition-all ${
                    theme === t.id 
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' 
                      : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
