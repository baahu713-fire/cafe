import React, { useState } from 'react';
import { forgotPassword } from '../services/authService';

const ForgotPasswordPage = () => {
    const [username, setUsername] = useState('');
    const [registrationKey, setRegistrationKey] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await forgotPassword({ username, registrationKey, newPassword });
            setSuccess('Password reset successfully! You can now log in with your new password.');
            setUsername('');
            setRegistrationKey('');
            setNewPassword('');
        } catch (err) {
            setError(err.message || 'Failed to reset password.');
        }
    };

    return (
        <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
            <h2>Forgot Password</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label>Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>Registration Key</label>
                    <input
                        type="text"
                        value={registrationKey}
                        onChange={(e) => setRegistrationKey(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>New Password</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <button type="submit" style={{ padding: '10px 15px' }}>Reset Password</button>
            </form>
        </div>
    );
};

export default ForgotPasswordPage;
