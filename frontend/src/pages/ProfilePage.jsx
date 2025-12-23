import React, { useState, useEffect } from 'react';
import { updateUserProfile, getUserProfile } from '../services/userService';

const ProfilePage = () => {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [photo, setPhoto] = useState(null);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userData = await getUserProfile();
                setName(userData.name);
            } catch (err) {
                setError('Failed to load user data.');
            }
        };
        fetchUserData();
    }, []);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const formData = new FormData();
        if (name) formData.append('name', name);
        if (password) formData.append('password', password);
        if (photo) formData.append('photo', photo);

        try {
            await updateUserProfile(formData);
            setSuccess('Profile updated successfully!');
            setPassword(''); // Clear password field
        } catch (err) {
            setError(err.message || 'Failed to update profile.');
        }
    };

    return (
        <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
            <h2>Edit Profile</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label>Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>New Password (leave blank to keep current)</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>Profile Photo</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        style={{ width: '100%' }}
                    />
                    {preview && <img src={preview} alt="Preview" style={{ marginTop: '10px', width: '100px', height: '100px' }} />}
                </div>
                <button type="submit" style={{ padding: '10px 15px' }}>Update Profile</button>
            </form>
        </div>
    );
};

export default ProfilePage;
