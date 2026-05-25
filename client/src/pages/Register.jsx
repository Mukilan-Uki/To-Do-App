import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      toast.success('Account created!');
      navigate('/');
    } catch (error) {
      toast.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-6">
      <div className="absolute inset-0 bg-dotted opacity-60" />
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-blue-200/40 dark:bg-blue-900/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] bg-indigo-200/30 dark:bg-indigo-900/15 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex items-baseline gap-1 mb-8 justify-center">
          <span className="text-4xl font-black" style={{ color: 'var(--donow-blue)' }}>Do</span>
          <span className="text-4xl font-black text-blue-500 animate-float">Now!</span>
        </div>

        <div className="bg-card/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/60 p-8">
          <h2 className="text-2xl font-black mb-1">Create account</h2>
          <p className="text-muted-foreground text-sm mb-8">Start managing your tasks today</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold mb-2">Full name</label>
              <input
                type="text" required
                className="w-full px-4 py-3 rounded-2xl bg-background border border-border focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-sm"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
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
              Create Account
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
