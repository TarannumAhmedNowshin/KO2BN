import { useState, useEffect } from 'react';
import axios from '../api/client';
import './AdminPanel.css';

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    role: 'team_member'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/users');
      setUsers(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({ email: '', username: '', password: '', role: 'team_member' });
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      username: user.username,
      password: '',
      role: user.role
    });
    setShowModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await axios.delete(`/api/admin/users/${userId}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // Update user
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password; // Don't send empty password
        await axios.put(`/api/admin/users/${editingUser.id}`, updateData);
      } else {
        // Create new user
        await axios.post('/api/admin/users', formData);
      }
      
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save user');
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'role-badge admin';
      case 'manager':
        return 'role-badge manager';
      default:
        return 'role-badge member';
    }
  };

  if (loading) {
    return <div className="admin-panel"><div className="loading">Loading users...</div></div>;
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>User Management</h1>
        <button className="btn-primary" onClick={handleAddUser}>
          + Add User
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <span className={getRoleBadgeClass(user.role)}>
                    {user.role}
                  </span>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <button 
                    className="btn-edit" 
                    onClick={() => handleEditUser(user)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-delete" 
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password {editingUser && '(leave blank to keep unchanged)'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                />
              </div>

              <div className="form-group">
                <label>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="team_member">Team Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
