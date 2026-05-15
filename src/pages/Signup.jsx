import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, GraduationCap, Briefcase, Building2, Calendar, BookOpen, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthBackground from '../components/AuthBackground';

const COURSE_DATA = {
  "UG Engineering Programs": [
    "Computer Science & Engineering",
    "Electronics & Communication",
    "Mechanical Engineering",
    "Information Science Engineering",
    "AI & Machine Learning",
    "Basic Science"
  ],
  "Research Programs": [
    "Ph.D. in CS", "Ph.D. in EC", "Ph.D. in ME", "Ph.D. in CV", 
    "Ph.D. in Phy", "Ph.D. in Che", "Ph.D. in Mat", "Ph.D. in MBA"
  ],
  "3 Year Degree Programs": [
    "B.Com", "B.Com + ACCA", "B.Com - Logistics", 
    "B.B.A", "B.B.A + Logistics", "B.B.A - Aviation", 
    "B.C.A", "B.C.A + Cloud", "B.Sc - Cyber Forensics"
  ],
  "Allied Health Sciences": [
    "BPT", "BSc MLT", "BSc MIT"
  ],
  "Pre University (PUC)": [
    "PCMB", "PCMC", "EBAC", "HEBA"
  ]
};

const YEARS_OF_STUDY = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const InputWrapper = ({ icon: Icon, children }) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
      <Icon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
    </div>
    {children}
  </div>
);

export default function Signup() {
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    courseCategory: '',
    courseName: '',
    yearOfStudy: '',
    passoutYear: '',
    company: '',
    jobRole: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Only JPG, PNG, and WebP are supported.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB.');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value,
      // Reset course name if category changes
      ...(name === 'courseCategory' && { courseName: '' })
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) return 'Full name is required';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) return 'Valid email is required';
    if (formData.password.length < 6) return 'Password must be at least 6 characters long';
    if (!formData.courseCategory) return 'Please select a course category';
    if (!formData.courseName) return 'Please select a specific course';
    
    if (role === 'student' && !formData.yearOfStudy) return 'Please select your year of study';
    
    if (role === 'alumni') {
      const year = parseInt(formData.passoutYear);
      const currentYear = new Date().getFullYear();
      if (!year || year < 2000 || year > currentYear) return `Passout year must be between 2000 and ${currentYear}`;
    }

    return null; // Valid
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    const errorMsg = validateForm();
    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }

    setLoading(true);
    
    const userMetaData = {
      full_name: formData.fullName,
      role: role,
      course_category: formData.courseCategory,
      course_name: formData.courseName,
      year_of_study: role === 'student' ? formData.yearOfStudy : null,
      passout_year: role === 'alumni' ? parseInt(formData.passoutYear) : null,
      company: role === 'alumni' ? formData.company || null : null,
      job_title: role === 'alumni' ? formData.jobRole || null : null,
    };

    // 1. Sign up user — the DB trigger will auto-create the profile
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: { data: userMetaData }
    });

    if (signUpError) {
      toast.error(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data?.user) {
      toast.error('Signup failed. Please try again.');
      setLoading(false);
      return;
    }

    // 2. Wait briefly for Supabase session to propagate, then upsert as safety net
    // The DB trigger should have created the profile already; this is a fallback.
    await new Promise(resolve => setTimeout(resolve, 1000));

    let uploadedAvatarUrl = null;
    if (avatarFile) {
      try {
        const ext = avatarFile.name.split('.').pop();
        const fileName = `${data.user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('profile-images')
          .upload(fileName, avatarFile, { cacheControl: '3600', upsert: false });
          
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('profile-images')
            .getPublicUrl(fileName);
          uploadedAvatarUrl = publicUrl;
        }
      } catch (err) {
        console.error('Avatar upload failed', err);
      }
    }

    const profilePayload = {
      id: data.user.id,
      email: formData.email,
      full_name: formData.fullName,
      role: role,
      is_approved: role === 'alumni' ? false : true,
      status: role === 'alumni' ? 'pending' : 'approved',
      course_category: formData.courseCategory,
      course_name: formData.courseName,
      year_of_study: role === 'student' ? formData.yearOfStudy : null,
      passout_year: role === 'alumni' ? parseInt(formData.passoutYear) : null,
      company: role === 'alumni' ? formData.company || null : null,
      job_title: role === 'alumni' ? formData.jobRole || null : null,
      ...(uploadedAvatarUrl && { avatar_url: uploadedAvatarUrl })
    };

    console.log('[Signup] Upserting profile payload:', profilePayload);

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' });

    if (profileError) {
      console.error('[Signup] Profile upsert failed (attempt 1):', profileError);
      
      // Retry once after another short delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      const { error: retryError } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      if (retryError) {
        console.error('[Signup] Profile upsert failed (attempt 2):', retryError);
        // The DB trigger should have created the profile, so we still navigate.
        // The error is non-fatal since the trigger is the primary mechanism.
        toast.success(
          role === 'alumni'
            ? 'Account created! Waiting for admin approval.'
            : 'Welcome to HKBK CE Connect!',
          { duration: 5000 }
        );
      } else {
        toast.success(
          role === 'alumni'
            ? 'Alumni account created! Waiting for admin approval.'
            : 'Welcome to HKBK CE Connect! Account created successfully.',
          { duration: 5000 }
        );
      }
    } else {
      toast.success(
        role === 'alumni'
          ? 'Alumni account created! Waiting for admin approval.'
          : 'Welcome to HKBK CE Connect! Account created successfully.',
        { duration: 5000 }
      );
    }

    navigate('/dashboard');
    setLoading(false);
  };


  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-slate-900">
      <AuthBackground
        title={<>Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">HKBK CE Connect.</span></>}
        subtitle={role === 'student'
          ? 'Connect with alumni, find mentorship, and unlock exclusive opportunities tailored for your growth.'
          : 'Give back to the community, hire top talent, and stay connected with your alma mater.'}
      />

      {/* Right side - Glassmorphism Form */}
      <div className="w-full lg:w-7/12 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-32 relative overflow-y-auto">
        <div className="absolute top-0 right-0 p-8 hidden md:block">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mx-auto w-full max-w-xl my-auto">
          <div className="text-left mb-10 md:hidden pt-8">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Create account</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Already have an account? <Link to="/login" className="font-semibold text-blue-600">Sign in</Link>
            </p>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl shadow-blue-900/5 rounded-3xl border border-gray-100 dark:border-slate-800">
            <div className="mb-10">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">I am joining as a</h3>
              <div className="grid grid-cols-2 gap-4">
                <label className={`relative flex cursor-pointer rounded-2xl border-2 p-5 transition-all duration-300 hover:shadow-md ${role === 'student' ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-600 shadow-blue-600/10' : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-200 dark:hover:border-slate-600'}`}>
                  <input type="radio" value="student" checked={role === 'student'} onChange={(e) => setRole(e.target.value)} className="sr-only" />
                  <div className="flex flex-col items-center justify-center w-full">
                    <GraduationCap className={`w-7 h-7 mb-3 transition-colors ${role === 'student' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-bold ${role === 'student' ? 'text-blue-900 dark:text-blue-200' : 'text-gray-600 dark:text-gray-300'}`}>Student</span>
                  </div>
                </label>
                
                <label className={`relative flex cursor-pointer rounded-2xl border-2 p-5 transition-all duration-300 hover:shadow-md ${role === 'alumni' ? 'bg-purple-50/50 dark:bg-purple-900/10 border-purple-600 shadow-purple-600/10' : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-200 dark:hover:border-slate-600'}`}>
                  <input type="radio" value="alumni" checked={role === 'alumni'} onChange={(e) => setRole(e.target.value)} className="sr-only" />
                  <div className="flex flex-col items-center justify-center w-full">
                    <Briefcase className={`w-7 h-7 mb-3 transition-colors ${role === 'alumni' ? 'text-purple-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-bold ${role === 'alumni' ? 'text-purple-900 dark:text-purple-200' : 'text-gray-600 dark:text-gray-300'}`}>Alumni</span>
                  </div>
                </label>
              </div>
            </div>

            <form className="space-y-5 animate-in fade-in duration-500" onSubmit={handleSignup}>
              
              {/* Optional Profile Image */}
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="relative w-24 h-24 rounded-full border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors flex items-center justify-center overflow-hidden group">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  )}
                  <input 
                    type="file" 
                    accept="image/jpeg, image/png, image/webp" 
                    onChange={handleAvatarChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-opacity pointer-events-none">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Upload</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Profile Photo (Optional)</p>
              </div>

              {/* Common Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputWrapper icon={User}>
                  <input type="text" name="fullName" required placeholder="Full Name" value={formData.fullName} onChange={handleChange}
                    className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all"
                  />
                </InputWrapper>

                <InputWrapper icon={Mail}>
                  <input type="email" name="email" required placeholder="Email Address" value={formData.email} onChange={handleChange}
                    className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all"
                  />
                </InputWrapper>
              </div>

              <InputWrapper icon={Lock}>
                <input type="password" name="password" required placeholder="Create Password (min 6 chars)" value={formData.password} onChange={handleChange}
                  className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all"
                />
              </InputWrapper>

              <div className="h-px bg-gray-100 dark:bg-slate-800 my-6"></div>

              {/* Course Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputWrapper icon={BookOpen}>
                  <select name="courseCategory" required value={formData.courseCategory} onChange={handleChange}
                    className={`block w-full pl-12 pr-10 py-3.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all appearance-none ${!formData.courseCategory ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}
                  >
                    <option value="" disabled>Course Category</option>
                    {Object.keys(COURSE_DATA).map(cat => <option key={cat} value={cat} className="text-gray-900 dark:text-white">{cat}</option>)}
                  </select>
                </InputWrapper>

                <InputWrapper icon={Layers}>
                  <select name="courseName" required value={formData.courseName} onChange={handleChange} disabled={!formData.courseCategory}
                    className={`block w-full pl-12 pr-10 py-3.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all appearance-none ${!formData.courseName ? 'text-gray-400' : 'text-gray-900 dark:text-white'} disabled:opacity-50`}
                  >
                    <option value="" disabled>Specific Course</option>
                    {formData.courseCategory && COURSE_DATA[formData.courseCategory].map(course => (
                      <option key={course} value={course} className="text-gray-900 dark:text-white">{course}</option>
                    ))}
                  </select>
                </InputWrapper>
              </div>

              {/* Dynamic Fields based on Role */}
              {role === 'student' && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                  <InputWrapper icon={Calendar}>
                    <select name="yearOfStudy" required value={formData.yearOfStudy} onChange={handleChange}
                      className={`block w-full pl-12 pr-10 py-3.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all appearance-none ${!formData.yearOfStudy ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}
                    >
                      <option value="" disabled>Current Year of Study</option>
                      {YEARS_OF_STUDY.map(year => <option key={year} value={year} className="text-gray-900 dark:text-white">{year}</option>)}
                    </select>
                  </InputWrapper>
                </div>
              )}

              {role === 'alumni' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
                  <InputWrapper icon={Calendar}>
                    <input type="number" name="passoutYear" required placeholder="Passout Year (e.g. 2021)" min="2000" max={new Date().getFullYear()} value={formData.passoutYear} onChange={handleChange}
                      className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm transition-all"
                    />
                  </InputWrapper>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputWrapper icon={Building2}>
                      <input type="text" name="company" placeholder="Current Company (Optional)" value={formData.company} onChange={handleChange}
                        className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm transition-all"
                      />
                    </InputWrapper>

                    <InputWrapper icon={Briefcase}>
                      <input type="text" name="jobRole" placeholder="Job Role (Optional)" value={formData.jobRole} onChange={handleChange}
                        className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm transition-all"
                      />
                    </InputWrapper>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-lg text-sm font-bold text-white transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 ${
                  role === 'student' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20' 
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-500/20'
                }`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>Create Account <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
