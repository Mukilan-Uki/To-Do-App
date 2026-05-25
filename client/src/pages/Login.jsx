import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showEs, setShowEs] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Animate "es" after a short delay
  useEffect(() => {
    const t = setTimeout(() => setShowEs(true), 600);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      toast.success('Welcome back!');
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (error) {
      toast.error(error);
    }
  };

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Decorative shapes */}
      <div className="absolute inset-0 bg-dotted opacity-60" />
      <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] bg-blue-200/40 dark:bg-blue-900/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] bg-indigo-200/30 dark:bg-indigo-900/15 rounded-full blur-3xl" />

      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-col justify-center items-start w-1/2 p-16 relative z-10">
        {/* Animated App Name */}
        <div className="flex items-baseline mb-8 select-none" style={{ lineHeight: 1 }}>
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-[7rem] font-black leading-none"
            style={{ color: 'var(--donow-blue)' }}
          >
            Do
          </motion.span>
          {showEs && (
            <motion.span
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="text-[7rem] font-black leading-none text-blue-500"
              style={{ animation: 'floatUpDown 2.4s ease-in-out 0.6s infinite' }}
            >
              Now!
            </motion.span>
          )}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-2xl font-bold text-foreground/80 mb-4"
        >
          Your tasks, beautifully managed.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="text-muted-foreground text-lg max-w-md leading-relaxed"
        >
          Stay organized, collaborate with your team, and get things done with AI-powered task management.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="flex flex-wrap gap-3 mt-10"
        >
          {['AI Task Creation', 'Team Collaboration', 'Smart Calendar', 'Progress Tracking'].map((f, i) => (
            <span
              key={f}
              className="px-4 py-2 rounded-full text-sm font-semibold bg-white/80 dark:bg-card/80 border border-border shadow-sm"
            >
              {f}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-baseline gap-1 mb-8 justify-center">
            <span className="text-4xl font-black" style={{ color: 'var(--donow-blue)' }}>Do</span>
            <span className="text-4xl font-black text-blue-500 animate-float">Now!</span>
          </div>

          <div className="bg-card/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/60 p-8">
            <h2 className="text-2xl font-black mb-1">Welcome back</h2>
            <p className="text-muted-foreground text-sm mb-8">Sign in to your account</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold mb-2">Email address</label>
                <input
                  type="email" required
                  className="w-full px-4 py-3 rounded-2xl bg-background border border-border focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} required
                    className="w-full px-4 py-3 rounded-2xl bg-background border border-border focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-sm pr-11"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all active:scale-[0.98] shadow-lg"
                style={{ background: 'linear-gradient(135deg, var(--donow-blue) 0%, #2563eb 100%)' }}
              >
                Sign In
              </button>
            </form>

            <p className="text-center mt-6 text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
