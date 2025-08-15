// frontend/src/components/admin/forms/RoomForm.jsx
// Form for creating and editing rooms

import { useState } from "react";
import FormField from "../shared/FormField";

export default function RoomForm({ initialData = {}, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    room_code: initialData.room_code || '',
    room_type: initialData.room_type || 'CLASSROOM',
    capacity: initialData.capacity || 30,
    has_projector: initialData.has_projector || false,
    has_computers: initialData.has_computers || false,
    has_smartboard: initialData.has_smartboard || false,
    has_sink: initialData.has_sink || false,
    is_bookable: initialData.is_bookable || false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const roomTypes = [
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

  const features = [
    { key: 'has_projector', label: 'Projector' },
    { key: 'has_computers', label: 'Computers' },
    { key: 'has_smartboard', label: 'Smartboard' },
    { key: 'has_sink', label: 'Sink' },
    { key: 'is_bookable', label: 'Bookable' }
  ];

  return (
    <form onSubmit={handleSubmit}>
      <FormField 
        label="Room Name" 
        required
      >
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g. Ms. Johnson's 3rd Grade"
          style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
          required
        />
      </FormField>

      <FormField 
        label="Room Code" 
        required
      >
        <input
          type="text"
          value={formData.room_code}
          onChange={(e) => handleChange('room_code', e.target.value.toUpperCase())}
          placeholder="e.g. 101"
          style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
          required
        />
      </FormField>

      <FormField label="Room Type">
        <select
          value={formData.room_type}
          onChange={(e) => handleChange('room_type', e.target.value)}
          style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
        >
          {roomTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Capacity">
        <input
          type="number"
          value={formData.capacity}
          onChange={(e) => handleChange('capacity', parseInt(e.target.value))}
          min="1"
          max="100"
          style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
          required
        />
      </FormField>
      
      <FormField label="Room Features">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {features.map(feature => (
            <label key={feature.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={formData[feature.key]}
                onChange={(e) => handleChange(feature.key, e.target.checked)}
              />
              <span>{feature.label}</span>
            </label>
          ))}
        </div>
      </FormField>
      
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
        <button 
          type="button" 
          onClick={onCancel}
          style={{ 
            padding: '8px 16px', 
            border: '1px solid #ccc', 
            borderRadius: 4, 
            background: 'white',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button 
          type="submit"
          style={{ 
            padding: '8px 16px', 
            border: 'none', 
            borderRadius: 4, 
            background: '#667eea', 
            color: 'white',
            cursor: 'pointer'
          }}
        >
          {initialData.id ? 'Update' : 'Create'} Room
        </button>
      </div>
    </form>
  );
}