import React, { useState } from 'react';
import TimeDisplay from './TimeDisplay';

const LoginScreen = ({ login, register }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        
        // Sanitize and validate inputs
        const cleanName = name.replace(/[<>]/g, "").trim();
        const cleanEmail = email.replace(/[<>]/g, "").trim();
        
        if (!isLogin && cleanName.length < 2) {
           setError("Full Name is too short (min 2 characters).");
           return;
        }
        if (!cleanEmail || !cleanEmail.includes('@')) {
           setError("A valid email is required.");
           return;
        }
        if (password.length < 6) {
           setError("Password must be at least 6 characters.");
           return;
        }

        try {
            setLoading(true);
            const result = isLogin 
                ? await login(cleanEmail, password) 
                : await register(cleanEmail, password, cleanName);
            setLoading(false);
            
            if (!result.success && result.message) {
                setError(result.message);
            } else if (result.success && result.message) {
                setSuccess(result.message);
            }
        } catch (apiError) {
            setLoading(false);
            setError("A secure connection could not be established. Please try again later.");
            console.error("Auth API Failure:", apiError);
        }
    };

    return (
        <div className="min-h-screen bg-[#05080f] flex items-center justify-center p-4 relative">
            {error && (
                <div className="absolute top-6 right-6 bg-red-600/90 text-white px-5 py-3 rounded-lg shadow-2xl border border-red-500 flex items-center gap-3 animate-slide-up z-50">
                    <i className="fas fa-exclamation-circle text-xl" aria-hidden="true"></i>
                    <div>
                        <div className="text-sm font-bold">Authentication Failed</div>
                        <div className="text-xs text-red-200">{error}</div>
                    </div>
                    <button onClick={() => setError(null)} className="ml-2 text-red-200 hover:text-white" aria-label="Dismiss">
                        <i className="fas fa-times" aria-hidden="true"></i>
                    </button>
                </div>
            )}

            {success && (
                <div className="absolute top-6 right-6 bg-emerald-600/90 text-white px-5 py-3 rounded-lg shadow-2xl border border-emerald-500 flex items-center gap-3 animate-slide-up z-50">
                    <i className="fas fa-check-circle text-xl" aria-hidden="true"></i>
                    <div>
                        <div className="text-sm font-bold">Action Successful</div>
                        <div className="text-xs text-emerald-100">{success}</div>
                    </div>
                    <button onClick={() => setSuccess(null)} className="ml-2 text-emerald-100 hover:text-white" aria-label="Dismiss">
                        <i className="fas fa-times" aria-hidden="true"></i>
                    </button>
                </div>
            )}
            
            <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(249,205,5,0.1)]">
                <div className="text-center mb-8">
                    <TimeDisplay className="justify-center mb-4" />
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-csk-gold to-yellow-600 flex items-center justify-center shadow-lg border border-yellow-300/50 mx-auto mb-4" aria-hidden="true">
                        <i className="fas fa-chart-pie text-black text-3xl"></i>
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Yellove<span className="text-csk-gold">OS</span> Access</h1>
                    <p className="text-gray-400 text-sm mt-2">Authentication required for SmartStadium Control</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label htmlFor="name" className="sr-only">Full Name</label>
                            <input
                                id="name"
                                type="text"
                                required
                                placeholder="Your Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                aria-label="Full Name"
                                className="w-full bg-gray-900 border border-gray-700 focus:border-csk-gold focus:ring-1 focus:ring-csk-gold rounded-xl px-4 py-3 text-sm text-gray-200 outline-none transition-all placeholder:text-gray-600"
                            />
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="sr-only">Email</label>
                        <input
                            id="email"
                            type="email"
                            required
                            placeholder="officer@csk.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            aria-label="Email address"
                            className="w-full bg-gray-900 border border-gray-700 focus:border-csk-gold focus:ring-1 focus:ring-csk-gold rounded-xl px-4 py-3 text-sm text-gray-200 outline-none transition-all placeholder:text-gray-600"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="sr-only">Password</label>
                        <input
                            id="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            aria-label="Password"
                            className="w-full bg-gray-900 border border-gray-700 focus:border-csk-gold focus:ring-1 focus:ring-csk-gold rounded-xl px-4 py-3 text-sm text-gray-200 outline-none transition-all placeholder:text-gray-600"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        aria-label={isLogin ? "Secure Login" : "Create Account"}
                        className="w-full bg-csk-gold hover:bg-yellow-500 text-black px-4 py-3 rounded-xl font-bold shadow-[0_0_15px_rgba(249,205,5,0.3)] transition-all focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 flex justify-center items-center gap-2 mt-2 disabled:opacity-70"
                    >
                        {loading ? <i className="fas fa-circle-notch animate-spin"></i> : <i className={isLogin ? "fas fa-lock" : "fas fa-user-plus"}></i>}
                        {loading ? 'Authenticating...' : (isLogin ? 'Secure Login' : 'Create Account')}
                    </button>
                    
                    <button 
                        type="button" 
                        aria-label={isLogin ? "Switch to account registration" : "Switch to secure login"}
                        onClick={() => { setIsLogin(!isLogin); setError(null); setSuccess(null); }}
                        className="w-full mt-2 text-xs text-csk-gold/80 hover:text-csk-gold font-bold transition-colors underline-offset-4 hover:underline"
                    >
                        {isLogin ? "Need access? Register here." : "Already authorized? Login here."}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 opacity-40 flex flex-col items-center gap-1.5 pointer-events-none select-none">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Powered by Google Maps Directions API
                    </div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Nearby transport via Google Places API
                    </div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Address conversion via Geocoding API
                    </div>
                    <div className="mt-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[9px] font-black text-orange-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                        <i className="fas fa-fire text-[10px]"></i> Securely Orchestrated via Google Firebase
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(LoginScreen);
