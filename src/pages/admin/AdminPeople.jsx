import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Trash2, Edit, Loader2, Image as ImageIcon, GraduationCap, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPeople() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [newPerson, setNewPerson] = useState({
    name: '',
    designation: '',
    department: '',
    is_alumni: false,
    image_url: ''
  });
  const [imageFile, setImageFile] = useState(null);

  const fetchPeople = async () => {
    const { data, error } = await supabase
      .from('faculty')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setPeople(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPeople();
    
    const subscription = supabase
      .channel('public:faculty')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'faculty' }, fetchPeople)
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  const handleEdit = (person) => {
    setNewPerson({
      name: person.name,
      designation: person.designation,
      department: person.department,
      is_alumni: person.is_alumni,
      image_url: person.image_url
    });
    setEditingId(person.id);
    setIsCreating(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;
    
    const { error } = await supabase.from('faculty').delete().eq('id', id);
    if (!error) {
      toast.success('Profile deleted successfully');
    } else {
      toast.error(error.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    let imageUrl = newPerson.image_url || null;

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `people/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery') // using gallery bucket for convenience
        .upload(filePath, imageFile);

      if (uploadError) {
        toast.error(`Image upload failed: ${uploadError.message}`);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('gallery')
          .getPublicUrl(filePath);
        imageUrl = publicUrl;
      }
    }

    const payload = {
      name: newPerson.name,
      designation: newPerson.designation,
      department: newPerson.department,
      is_alumni: newPerson.is_alumni === 'true' || newPerson.is_alumni === true,
      image_url: imageUrl
    };

    let dbError;
    if (editingId) {
      const { error } = await supabase.from('faculty').update(payload).eq('id', editingId);
      dbError = error;
    } else {
      const { error } = await supabase.from('faculty').insert([payload]);
      dbError = error;
    }

    if (!dbError) {
      toast.success(editingId ? 'Profile updated!' : 'Profile created!');
      setIsCreating(false);
      setEditingId(null);
      setNewPerson({ name: '', designation: '', department: '', is_alumni: false, image_url: '' });
      setImageFile(null);
    } else {
      toast.error(dbError.message);
    }
    setIsSubmitting(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600" />
          People Management
        </h1>
        <button 
          onClick={() => {
            setIsCreating(!isCreating);
            if (isCreating) {
              setEditingId(null);
              setNewPerson({ name: '', designation: '', department: '', type: 'faculty', image_url: '' });
              setImageFile(null);
            }
          }}
          className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
        >
          {isCreating ? 'Cancel' : 'Add Profile'}
        </button>
      </div>

      {isCreating && (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Profile' : 'Add New Profile'}</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={newPerson.name}
                  onChange={(e) => setNewPerson({...newPerson, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select 
                  value={newPerson.is_alumni}
                  onChange={(e) => setNewPerson({...newPerson, is_alumni: e.target.value === 'true'})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  <option value={false}>Faculty</option>
                  <option value={true}>Alumni</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Designation</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. Professor, CEO, Director"
                  value={newPerson.designation}
                  onChange={(e) => setNewPerson({...newPerson, designation: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Department / Company</label>
                <input 
                  required
                  type="text" 
                  value={newPerson.department}
                  onChange={(e) => setNewPerson({...newPerson, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Profile Image</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center justify-center w-full h-32 px-4 transition bg-gray-50 dark:bg-slate-900 border-2 border-gray-300 dark:border-slate-600 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none relative overflow-hidden">
                  {newPerson.image_url && !imageFile && (
                    <img src={newPerson.image_url} alt="Current" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                  )}
                  <span className="flex items-center space-x-2 relative z-10">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                    <span className="font-medium text-gray-500 dark:text-gray-400">
                      {imageFile ? imageFile.name : (editingId && newPerson.image_url ? 'Replace existing image' : 'Drop image to attach')}
                    </span>
                  </span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-md font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : (editingId ? 'Update Profile' : 'Save Profile')}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {people?.map((person) => (
          <div key={person.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300">
            <div className="w-full h-56 overflow-hidden bg-gray-100 dark:bg-slate-900 relative">
              {person.image_url ? (
                <img 
                  src={person.image_url} 
                  alt={person.name} 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-slate-900"><span class="text-gray-400">No Image</span></div>';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-slate-900">
                  <User className="w-16 h-16 text-gray-300" />
                </div>
              )}
              <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                {person.is_alumni === false ? <Briefcase className="w-3 h-3 text-blue-600" /> : <GraduationCap className="w-3 h-3 text-purple-600" />}
                <span className={person.is_alumni === false ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}>
                  {person.is_alumni ? 'Alumni' : 'Faculty'}
                </span>
              </div>
            </div>
            <div className="p-5 flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{person.name}</h3>
              <p className="text-blue-600 dark:text-blue-400 font-medium text-sm mb-1">{person.designation}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{person.department}</p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700/50 p-3 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-2">
              <button 
                onClick={() => handleEdit(person)}
                className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1.5 rounded-md transition-colors text-sm font-medium flex items-center gap-1"
              >
                <Edit className="w-4 h-4" /> Edit
              </button>
              <button 
                onClick={() => handleDelete(person.id)}
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        ))}
        {people.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl">
            No profiles found. Add one above!
          </div>
        )}
      </div>
    </div>
  );
}
