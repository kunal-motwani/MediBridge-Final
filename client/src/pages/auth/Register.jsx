import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { registerPatient } from '../../services/authService';
import useAuthStore from '../../store/authStore';

const initialForm = {
  firstName: '', lastName: '', email: '', password: '', phone: '', accessPin: '',
};

const Register = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await registerPatient(form);
      setAuth(data.data);
      toast.success(`Registered! Your Health ID is ${data.data.user.healthId}`);
      navigate('/dashboard');
    } catch (err) {
      const fieldErrors = err.response?.data?.errors;
      if (fieldErrors && fieldErrors.length > 0) {
        toast.error(fieldErrors.map((e) => e.message).join('. '));
      } else {
        toast.error(err.response?.data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold text-slate-800">Create your Health ID</h1>
        <p className="mt-1 text-sm text-slate-500">One record, every hospital</p>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">First name</label>
            <input name="firstName" required value={form.firstName} onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Last name</label>
            <input name="lastName" required value={form.lastName} onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input type="email" name="email" required value={form.email} onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium text-slate-700">Password</label>
          <input type="password" name="password" required minLength={8} value={form.password} onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium text-slate-700">Phone</label>
          <input name="phone" value={form.phone} onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium text-slate-700">4-digit access PIN</label>
          <p className="text-xs text-slate-400">Share this with doctors to grant them 24hr access to your records</p>
          <input name="accessPin" required pattern="\d{4}" maxLength={4} inputMode="numeric"
            value={form.accessPin} onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <button type="submit" disabled={loading}
          className="mt-6 w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">Log in</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
