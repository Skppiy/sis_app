// frontend/src/components/admin/tabs/FacilitiesTab.jsx
// Room and facilities management

import { useState } from "react";
import { apiPost, apiPatch, apiDelete } from "../../../requestHelper";
import { useAuth } from "../../../AuthContext";
import RoomForm from "../forms/RoomForm";
import Modal from "../shared/Modal";

export default function FacilitiesTab({ data, onDataChange, onError, onClearError }) {
  const { active_school } = useAuth();
  const { rooms } = data;
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const handleCreateRoom = async (roomData) => {
    try {
      onClearError();
      await apiPost("/rooms", { ...roomData, school_id: active_school });
      onDataChange();
      closeForm();
    } catch (e) {
      console.error("Failed to create room:", e);
      onError(`Failed to create room: ${e.message}`);
    }
  };

  const handleUpdateRoom = async (roomId, roomData) => {
    try {
      onClearError();
      await apiPatch(`/rooms/${roomId}`, roomData);
      onDataChange();
      closeForm();
    } catch (e) {
      console.error("Failed to update room:", e);
      onError(`Failed to update room: ${e.message}`);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    
    try {
      onClearError();
      await apiDelete(`/rooms/${roomId}`);
      onDataChange();
    } catch (e) {
      console.error("Failed to delete room:", e);
      onError(`Failed to delete room: ${e.message}`);
    }
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRoom(null);
  };

  const handleSubmit = async (roomData) => {
    if (editingRoom) {
      await handleUpdateRoom(editingRoom.id, roomData);
    } else {
      await handleCreateRoom(roomData);
    }
  };

  return (
    <>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="section-title">Rooms & Facilities</h2>
          <button
            onClick={() => setShowForm(true)}
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
                  
                  {/* Room Features */}
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
                
                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 8 }}>
                  <button
                    onClick={() => handleEditRoom(room)}
                    style={{ 
                      background: '#f6ad55', 
                      color: 'white', 
                      border: 'none', 
                      padding: '4px 8px', 
                      borderRadius: 4, 
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'