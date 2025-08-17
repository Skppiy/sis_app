// frontend/src/components/admin/tabs/FacilitiesTab.jsx
// Fixed facilities management with proper error handling

import { useState, useMemo } from "react";
import { apiPost, apiPatch, apiDelete } from "../../../requestHelper";
import { useAuth } from "../../../AuthContext";

export default function FacilitiesTab({ data, onDataChange, onError }) {
  const { active_school } = useAuth();
  const { rooms, classrooms } = data;
  
  // Enhanced state management
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Enhanced filtering and search
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesSearch = searchTerm === '' || 
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.room_code.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterType === 'ALL' || room.room_type === filterType;
      
      return matchesSearch && matchesFilter;
    });
  }, [rooms, searchTerm, filterType]);

  // Analytics calculations
  const analytics = useMemo(() => {
    const totalRooms = rooms.length;
    const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
    const avgCapacity = totalRooms > 0 ? Math.round(totalCapacity / totalRooms) : 0;
    
    const roomsByType = rooms.reduce((acc, room) => {
      acc[room.room_type] = (acc[room.room_type] || 0) + 1;
      return acc;
    }, {});

    const featuresCount = {
      projector: rooms.filter(r => r.has_projector).length,
      computers: rooms.filter(r => r.has_computers).length,
      smartboard: rooms.filter(r => r.has_smartboard).length,
      sink: rooms.filter(r => r.has_sink).length,
      bookable: rooms.filter(r => r.is_bookable).length
    };

    // Calculate room utilization (if classrooms data available)
    const usedRooms = classrooms ? new Set(classrooms.map(c => c.room_id).filter(Boolean)).size : 0;
    const utilizationRate = totalRooms > 0 ? Math.round((usedRooms / totalRooms) * 100) : 0;

    return {
      totalRooms,
      totalCapacity,
      avgCapacity,
      roomsByType,
      featuresCount,
      utilizationRate,
      usedRooms
    };
  }, [rooms, classrooms]);

  // CRUD operations with better error handling
  const handleCreateRoom = async () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.room_code) {
        onError("Room name and code are required");
        return;
      }

      if (!active_school) {
        onError("No active school selected");
        return;
      }

      // Prepare payload with all required fields
      const payload = {
        name: formData.name.trim(),
        room_code: formData.room_code.trim().toUpperCase(),
        room_type: formData.room_type || 'CLASSROOM',
        capacity: parseInt(formData.capacity) || 30,
        has_projector: Boolean(formData.has_projector),
        has_computers: Boolean(formData.has_computers),
        has_smartboard: Boolean(formData.has_smartboard),
        has_sink: Boolean(formData.has_sink),
        is_bookable: Boolean(formData.is_bookable),
        school_id: active_school
      };

      console.log("Creating room with payload:", payload);
      
      const response = await apiPost("/rooms", payload);
      console.log("Room created successfully:", response);
      
      await onDataChange();
      closeForm();
    } catch (e) {
      console.error("Failed to create room:", e);
      const errorMessage = e.response?.data?.detail || e.message || "Unknown error occurred";
      onError(`Failed to create room: ${errorMessage}`);
    }
  };

  const handleUpdateRoom = async () => {
    try {
      if (!editingRoom || !editingRoom.id) {
        onError("No room selected for editing");
        return;
      }

      // Validate required fields
      if (!formData.name || !formData.room_code) {
        onError("Room name and code are required");
        return;
      }

      // Prepare payload with all fields
      const payload = {
        name: formData.name.trim(),
        room_code: formData.room_code.trim().toUpperCase(),
        room_type: formData.room_type || 'CLASSROOM',
        capacity: parseInt(formData.capacity) || 30,
        has_projector: Boolean(formData.has_projector),
        has_computers: Boolean(formData.has_computers),
        has_smartboard: Boolean(formData.has_smartboard),
        has_sink: Boolean(formData.has_sink),
        is_bookable: Boolean(formData.is_bookable)
      };

      console.log("Updating room with payload:", payload);
      
      const response = await apiPatch(`/rooms/${editingRoom.id}`, payload);
      console.log("Room updated successfully:", response);
      
      await onDataChange();
      closeForm();
    } catch (e) {
      console.error("Failed to update room:", e);
      const errorMessage = e.response?.data?.detail || e.message || "Unknown error occurred";
      onError(`Failed to update room: ${errorMessage}`);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    
    try {
      await apiDelete(`/rooms/${roomId}`);
      await onDataChange();
    } catch (e) {
      console.error("Failed to delete room:", e);
      const errorMessage = e.response?.data?.detail || e.message || "Unknown error occurred";
      onError(`Failed to delete room: ${errorMessage}`);
    }
  };

  // Form helpers with better validation
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
    setFormData({
      name: room.name || '',
      room_code: room.room_code || '',
      room_type: room.room_type || 'CLASSROOM',
      capacity: room.capacity || 30,
      has_projector: Boolean(room.has_projector),
      has_computers: Boolean(room.has_computers),
      has_smartboard: Boolean(room.has_smartboard),
      has_sink: Boolean(room.has_sink),
      is_bookable: Boolean(room.is_bookable)
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRoom(null);
    setFormData({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingRoom) {
      await handleUpdateRoom();
    } else {
      await handleCreateRoom();
    }
  };

  const roomTypes = [
    { value: 'ALL', label: 'All Rooms' },
    { value: 'CLASSROOM', label: 'Classroom' },
    { value: 'OFFICE', label: 'Office' },
    { value: 'GYM', label: 'Gymnasium' },
    { value: 'LIBRARY', label: 'Library' },
    { value: 'LAB', label: 'Laboratory' },
    { value: 'ART', label: 'Art Room' },
    { value: 'MUSIC', label: 'Music Room' },
    { value: 'COMPUTER', label: 'Computer Lab' },
    { value: 'OTHER', label: 'Other' }
  ];

  return (
    <>
      {/* Enhanced Header with Analytics Toggle */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="section-title">Rooms & Facilities</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              style={{ 
                background: showAnalytics ? '#4299e1' : '#e2e8f0', 
                color: showAnalytics ? 'white' : '#4a5568', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              📊 Analytics
            </button>
            <button
              onClick={openAddForm}
              disabled={!active_school}
              style={{ 
                background: active_school ? '#667eea' : '#a0aec0', 
                color: 'white', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: 4,
                cursor: active_school ? 'pointer' : 'not-allowed'
              }}
              title={!active_school ? 'Please select a school first' : 'Add new room'}
            >
              ➕ Add Room
            </button>
          </div>
        </div>
        
        {/* Search and Filter Controls */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search rooms by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              flex: 1, 
              minWidth: 200, 
              padding: '8px 12px', 
              borderRadius: 4, 
              border: '1px solid #ddd' 
            }}
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ 
              padding: '8px 12px', 
              borderRadius: 4, 
              border: '1px solid #ddd',
              minWidth: 150 
            }}
          >
            {roomTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Results Summary */}
        <div style={{ 
          padding: '8px 12px', 
          background: '#f7fafc', 
          borderRadius: 4, 
          marginBottom: 16,
          fontSize: '0.875rem',
          color: '#4a5568'
        }}>
          Showing {filteredRooms.length} of {rooms.length} rooms
          {searchTerm && ` • Search: "${searchTerm}"`}
          {filterType !== 'ALL' && ` • Filter: ${roomTypes.find(t => t.value === filterType)?.label}`}
        </div>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && (
        <div className="card">
          <h3 className="section-title">Facilities Analytics</h3>
          
          {/* Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div style={{ background: '#f7fafc', padding: 16, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2d3748' }}>{analytics.totalRooms}</div>
              <div style={{ color: '#718096' }}>Total Rooms</div>
            </div>
            <div style={{ background: '#f7fafc', padding: 16, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2d3748' }}>{analytics.totalCapacity}</div>
              <div style={{ color: '#718096' }}>Total Capacity</div>
            </div>
            <div style={{ background: '#f7fafc', padding: 16, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2d3748' }}>{analytics.avgCapacity}</div>
              <div style={{ color: '#718096' }}>Average Capacity</div>
            </div>
            <div style={{ background: '#f7fafc', padding: 16, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2d3748' }}>{analytics.utilizationRate}%</div>
              <div style={{ color: '#718096' }}>Room Utilization</div>
            </div>
          </div>

          {/* Room Types Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div>
              <h4 style={{ margin: '0 0 12px 0', color: '#2d3748' }}>Rooms by Type</h4>
              <div style={{ display: 'grid', gap: 8 }}>
                {Object.entries(analytics.roomsByType).map(([type, count]) => (
                  <div key={type} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: '#f7fafc', borderRadius: 4 }}>
                    <span>{type}</span>
                    <span style={{ fontWeight: 'bold' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 12px 0', color: '#2d3748' }}>Equipment & Features</h4>
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: '#f7fafc', borderRadius: 4 }}>
                  <span>🎥 Projectors</span>
                  <span style={{ fontWeight: 'bold' }}>{analytics.featuresCount.projector}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: '#f7fafc', borderRadius: 4 }}>
                  <span>💻 Computer Labs</span>
                  <span style={{ fontWeight: 'bold' }}>{analytics.featuresCount.computers}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: '#f7fafc', borderRadius: 4 }}>
                  <span>📺 Smartboards</span>
                  <span style={{ fontWeight: 'bold' }}>{analytics.featuresCount.smartboard}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: '#f7fafc', borderRadius: 4 }}>
                  <span>🚰 Sinks</span>
                  <span style={{ fontWeight: 'bold' }}>{analytics.featuresCount.sink}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: '#f7fafc', borderRadius: 4 }}>
                  <span>📅 Bookable</span>
                  <span style={{ fontWeight: 'bold' }}>{analytics.featuresCount.bookable}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rooms Display */}
      <div className="card">
        {/* Show empty state if no rooms */}
        {filteredRooms.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#718096',
            background: '#f7fafc',
            borderRadius: 8,
            border: '2px dashed #e2e8f0'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 16 }}>🏫</div>
            {rooms.length === 0 ? (
              <>
                <h3 style={{ margin: '0 0 8px 0' }}>No Rooms Created Yet</h3>
                <p style={{ margin: '0 0 16px 0' }}>
                  Create your first room to start managing facilities
                </p>
                <button
                  onClick={openAddForm}
                  disabled={!active_school}
                  style={{ 
                    background: active_school ? '#667eea' : '#a0aec0', 
                    color: 'white', 
                    border: 'none', 
                    padding: '8px 16px', 
                    borderRadius: 4,
                    cursor: active_school ? 'pointer' : 'not-allowed'
                  }}
                >
                  Create First Room
                </button>
              </>
            ) : (
              <>
                <h3 style={{ margin: '0 0 8px 0' }}>No Rooms Match Your Search</h3>
                <p style={{ margin: '0 0 16px 0' }}>
                  Try adjusting your search terms or filters
                </p>
                <button
                  onClick={() => { setSearchTerm(''); setFilterType('ALL'); }}
                  style={{ 
                    background: '#667eea', 
                    color: 'white', 
                    border: 'none', 
                    padding: '8px 16px', 
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          /* Enhanced rooms grid */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filteredRooms.map(room => {
              // Check if room is being used by any classroom
              const isInUse = classrooms && classrooms.some(c => c.room_id === room.id);
              
              return (
                <div key={room.id} className="card" style={{ margin: 0, position: 'relative' }}>
                  {/* Usage indicator */}
                  {isInUse && (
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: '#48bb78',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      IN USE
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, paddingRight: 8 }}>
                      <h3 style={{ margin: '0 0 8px 0' }}>{room.name}</h3>
                      <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                        Code: {room.room_code} • Type: {room.room_type}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#718096', marginTop: 4 }}>
                        Capacity: {room.capacity}
                      </div>
                      
                      {/* Enhanced feature badges */}
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {room.has_projector && (
                          <span style={{ background: '#bee3f8', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem' }}>
                            🎥 Projector
                          </span>
                        )}
                        {room.has_computers && (
                          <span style={{ background: '#c6f6d5', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem' }}>
                            💻 Computers
                          </span>
                        )}
                        {room.has_smartboard && (
                          <span style={{ background: '#d6f5d6', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem' }}>
                            📺 Smartboard
                          </span>
                        )}
                        {room.has_sink && (
                          <span style={{ background: '#fed7d7', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem' }}>
                            🚰 Sink
                          </span>
                        )}
                        {room.is_bookable && (
                          <span style={{ background: '#fbb6ce', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem' }}>
                            📅 Bookable
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Enhanced action buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <button
                        onClick={() => openEditForm(room)}
                        style={{ 
                          background: '#4299e1', 
                          color: 'white', 
                          border: 'none', 
                          padding: '4px 8px', 
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        disabled={isInUse}
                        style={{ 
                          background: isInUse ? '#a0aec0' : '#e53e3e', 
                          color: 'white', 
                          border: 'none', 
                          padding: '4px 8px', 
                          borderRadius: 4,
                          cursor: isInUse ? 'not-allowed' : 'pointer',
                          fontSize: '0.75rem'
                        }}
                        title={isInUse ? 'Cannot delete room that is in use' : 'Delete room'}
                      >
                        {isInUse ? 'In Use' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Enhanced Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ margin: 16, maxWidth: 500, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <h2 className="section-title">{editingRoom ? 'Edit Room' : 'Add Room'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: 16 }}>
                
                {/* Form fields with proper validation */}
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                    Room Name <span style={{ color: 'red' }}>*</span>:
                  </label>
                  <input
                    type="text"
                    placeholder="Ms. Johnson's 3rd Grade"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    style={{ 
                      width: '100%', 
                      padding: 8, 
                      borderRadius: 4, 
                      border: !formData.name ? '2px solid #e53e3e' : '1px solid #ddd'
                    }}
                    required
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                    Room Code <span style={{ color: 'red' }}>*</span>:
                  </label>
                  <input
                    type="text"
                    placeholder="101"
                    value={formData.room_code || ''}
                    onChange={(e) => setFormData({...formData, room_code: e.target.value.toUpperCase()})}
                    style={{ 
                      width: '100%', 
                      padding: 8, 
                      borderRadius: 4, 
                      border: !formData.room_code ? '2px solid #e53e3e' : '1px solid #ddd'
                    }}
                    required
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Room Type:</label>
                  <select
                    value={formData.room_type || 'CLASSROOM'}
                    onChange={(e) => setFormData({...formData, room_type: e.target.value})}
                    style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                  >
                    {roomTypes.slice(1).map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Capacity:</label>
                  <input
                    type="number"
                    value={formData.capacity || 30}
                    onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 30})}
                    min="1"
                    max="100"
                    style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                  />
                </div>
                
                {/* Enhanced feature checkboxes with icons */}
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Room Features & Equipment:</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={formData.has_projector || false}
                        onChange={(e) => setFormData({...formData, has_projector: e.target.checked})}
                      />
                      <span>🎥 Projector</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={formData.has_computers || false}
                        onChange={(e) => setFormData({...formData, has_computers: e.target.checked})}
                      />
                      <span>💻 Computers</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={formData.has_smartboard || false}
                        onChange={(e) => setFormData({...formData, has_smartboard: e.target.checked})}
                      />
                      <span>📺 Smartboard</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={formData.has_sink || false}
                        onChange={(e) => setFormData({...formData, has_sink: e.target.checked})}
                      />
                      <span>🚰 Sink</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={formData.is_bookable || false}
                        onChange={(e) => setFormData({...formData, is_bookable: e.target.checked})}
                      />
                      <span>📅 Bookable</span>
                    </label>
                  </div>
                </div>
                
                {/* Form buttons */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={closeForm}
                    style={{ 
                      background: '#e2e8f0', 
                      color: '#4a5568', 
                      border: 'none', 
                      padding: '8px 16px', 
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!formData.name || !formData.room_code}
                    style={{ 
                      background: (formData.name && formData.room_code) ? '#667eea' : '#a0aec0', 
                      color: 'white', 
                      border: 'none', 
                      padding: '8px 16px', 
                      borderRadius: 4,
                      cursor: (formData.name && formData.room_code) ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {editingRoom ? 'Update Room' : 'Create Room'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}