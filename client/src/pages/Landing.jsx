import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const Landing = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login, register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <header className="mb-12 text-center">
        <h1 className="text-6xl font-bold text-yellow-500 tracking-tighter">Muse<span className="text-gray-100">Type</span></h1>
        <p className="text-gray-400 mt-2 text-xl">play the music as you type.</p>
      </header>

      <div className="w-full max-w-md bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-2xl">
        <h2 className="text-2xl font-semibold mb-6 text-white text-center">
          {isLogin ? 'Welcome Back' : 'Create an Account'}
        </h2>
        
        {error && <div className="bg-red-500/10 text-red-500 p-3 rounded mb-4 text-center text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-gray-400 text-sm mb-1">Username</label>
              <input 
                type="text" 
                required 
                className="w-full bg-gray-800 text-white rounded p-3 outline-none focus:ring-2 focus:ring-yellow-500"
                value={username} onChange={e => setUsername(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="block text-gray-400 text-sm mb-1">Email</label>
            <input 
              type="email" 
              required 
              className="w-full bg-gray-800 text-white rounded p-3 outline-none focus:ring-2 focus:ring-yellow-500"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Password</label>
            <input 
              type="password" 
              required 
              className="w-full bg-gray-800 text-white rounded p-3 outline-none focus:ring-2 focus:ring-yellow-500"
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-3 rounded transition-colors mt-4">
            {isLogin ? 'Start Playing' : 'Register'}
          </button>
        </form>

        <p className="text-gray-500 mt-6 text-center text-sm">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-yellow-500 hover:underline">
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Landing;
