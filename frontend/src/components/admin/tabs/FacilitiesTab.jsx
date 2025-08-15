// frontend/src/components/admin/tabs/FacilitiesTab.jsx
// Simple room management with full CRUD

import { useState } from "react";
import { apiPost, apiPatch, apiDelete } from "../../../requestHelper";
import { useAuth } from "../../../AuthContext";

export default function FacilitiesTab({ data, onDataChange, onError }) {
  const { active_school } = useAuth();
  const { rooms } = data;
  
  // Simple form state
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({});

  // Simple room creation
  const handleCreateRoom = async () => {
    try {
      await apiPost("/rooms", { ...formData, school_id: active_school });
      onDataChange();
      closeForm();
    } catch (e) {
      console.error("Failed to create room:", e);
      onError(`Failed to create room: ${e.message}`);
    }
  };

  // Simple room update
  const handleUpdateRoom = async () => {
    try {
      await apiPatch(`/rooms/${editingRoom.id}`, formData);
      onDataChange();
      closeForm();
    } catch (e) {
      console.error("Failed to update room:", e);
      onError(`Failed to update room: ${e.message}`);
    }
  };

  // Simple room deletion
  const handleDeleteRoom = async (roomId) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    
    try {
      await apiDelete(`/rooms/${roomId}`);
      onDataChange();
    } catch (e) {
      console.error("Failed to delete room:", e);
      onError(`Failed to delete room: ${e.message}`);
    }
  };

  // Simple form helpers
  const openAddForm = () => {
    setEditingRoom(null);
    setFormData({
      name: '',
      room_code: '',
      room_type: 'CLASSROOM',
      capacity: 30,
      has_projector: false,
      has_computers: false,
      has_smartboard: false,
      has_sink: false,
      is_bookable: false
    });
    setShowForm(true);
  };

  const openEditForm = (room) => {
    setEditingRoom(room);
    setFormData({ ...room });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRoom(null);
    setFormData({});
  };

  const handleSubmit = () => {
    if (editingRoom) {
      handleUpdateRoom();
    } else {
      handleCreateRoom();
    }
  };

  return (
    <>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="section-title">Rooms & Facilities</h2>
          <button
            onClick={openAddForm}
            style={{ 
              background: '#667eea', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            ➕ Add Room
          </button>
        </div>
        
        {/* Simple rooms grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {rooms.map(room => (
            <div key={room.id} className="card" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0' }}>{room.name}</h3>
                  <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                    Code: {room.room_code} • Type: {room.room_type}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#718096', marginTop: 4 }}>
                    Capacity: {room.capacity}
                  </div>
                  
                  {/* Simple feature badges */}
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {room.has_projector && (
                      <span style={{ background: '#bee3f8', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem' }}>
                        Projector
                      </span>
                    )}
                    {room.has_computers && (
                      <span style={{ background: '#c6f6d5', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem' }}>
                        Computers
                      </span>
                    )}
                    {room.has_smartboard && (
                      <span style={{ background: '#d6f5d6', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem' }}>
                        Smartboard
                      </span>
                    )}
                    {room.has_sink && (
                      <span style={{ background: '#fed7d7', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem' }}>
                        Sink
                      </span>
                    )}
                    {room.is_bookable && (
                      <span style={{ background: '#fbb6ce', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem' }}>
                        Bookable
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Simple action buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 8 }}>
                  <button
                    onClick={() => openEditForm(room)}
                    style={{ 
                      background: '#f6ad55', 
                      color: 'white', 
                      border: 'none', 
                      padding: '4px 8px', 
                      borderRadius: 4, 
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRoom(room.id)}
                    style={{ 
                      background: '#f56565', 
                      color: 'white', 
                      border: 'none', 
                      padding: '4px 8px', 
                      borderRadius: 4, 
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Simple empty state */}
        {rooms.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#718096',
            background: '#f7fafc',
            borderRadius: 8,
            border: '2px dashed #e2e8f0'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 16 }}>🏢</div>
            <h3 style={{ margin: '0 0 8px 0' }}>No Rooms Created</h3>
            <p style={{ margin: '0 0 16px 0' }}>
              Create rooms first to enable classroom assignments and scheduling.
            </p>
            <button
              onClick={openAddForm}
              style={{ 
                background: '#667eea', 
                color: 'white', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Create Your First Room
            </button>
          </div>
        )}
      </div>

      {/* Simple room form modal */}
      {showForm && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.5)', 
          zIndex: 1000, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <div className="card" style={{ maxWidth: 500, width: '90%', maxHeight: '90%', overflow: 'auto' }}>
            <h2>{editingRoom ? 'Edit Room' : 'Add Room'}</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              
              {/* Simple form fields */}
              <div>
                <label>Room Name:</label>
                <input
                  type="text"
                  placeholder="Ms. Johnson's 3rd Grade"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                />
              </div>
              
              <div>
                <label>Room Code:</label>
                <input
                  type="text"
                  placeholder="101"
                  value={formData.room_code || ''}
                  onChange={(e) => setFormData({...formData, room_code: e.target.value.toUpperCase()})}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                />
              </div>
              
              <div>
                <label>Room Type:</label>
                <select
                  value={formData.room_type || 'CLASSROOM'}
                  onChange={(e) => setFormData({...formData, room_type: e.target.value})}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                >
                  <option value="CLASSROOM">Classroom</option>
                  <option value="OFFICE">Office</option>
                  <option value="GYM">Gymnasium</option>
                  <option value="LIBRARY">Library</option>
                  <option value="LAB">Laboratory</option>
                  <option value="ART">Art Room</option>
                  <option value="MUSIC">Music Room</option>
                  <option value="COMPUTER">Computer Lab</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div>
                <label>Capacity:</label>
                <input
                  type="number"
                  value={formData.capacity || 30}
                  onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                  min="1"
                  max="100"
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                />
              </div>
              
              {/* Simple feature checkboxes */}
              <div>
                <label>Room Features:</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={formData.has_projector || false}
                      onChange={(e) => setFormData({...formData, has_projector: e.target.checked})}
                    />
                    <span>Projector</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={formData.has_computers || false}
                      onChange={(e) => setFormData({...formData, has_computers: e.target.checked})}
                    />
                    <span>Computers</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={formData.has_smartboard || false}
                      onChange={(e) => setFormData({...formData, has_smartboard: e.target.checked})}
                    />
                    <span>Smartboard</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={formData.has_sink || false}
                      onChange={(e) => setFormData({...formData, has_sink: e.target.checked})}
                    />
                    <span>Sink</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={formData.is_bookable || false}
                      onChange={(e) => setFormData({...formData, is_bookable: e.target.checked})}
                    />
                    <span>Bookable</span>
                  </label>
                </div>
              </div>
              
              {/* Simple form actions */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  onClick={handleSubmit} 
                  style={{ 
                    background: '#667eea', 
                    color: 'white', 
                    border: 'none', 
                    padding: '8px 16px', 
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  {editingRoom ? 'Update' : 'Create'} Room
                </button>
                <button 
                  onClick={closeForm} 
                  style={{ 
                    background: '#718096', 
                    color: 'white', 
                    border: 'none', 
                    padding: '8px 16px', 
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}