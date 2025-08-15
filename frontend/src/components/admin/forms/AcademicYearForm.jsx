// frontend/src/components/admin/forms/AcademicYearForm.jsx
// Academic year creation form

import { useState } from "react";
import FormField from "../shared/FormField";

export default function AcademicYearForm({ initialData = {}, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    start_date: initialData.start_date || '',
    end_date: initialData.end_date || '',
    is_active: initialData.is_active || false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormField label="Academic Year Name" required>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g. 2024-2025"
          style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
          required
        />
      </FormField>

      <FormField label="Start Date" required>
        <input
          type="date"
          value={formData.start_date}
          onChange={(e) => handleChange('start_date', e.target.value)}
          style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
          required
        />
      </FormField>

      <FormField label="End Date" required>
        <input
          type="date"
          value={formData.end_date}
          onChange={(e) => handleChange('end_date', e.target.value)}
          style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
          required
        />
      </FormField>

      <FormField label="Settings">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => handleChange('is_active', e.target.checked)}
          />
          <span>Set as Active Academic Year</span>
        </label>
      </FormField>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
        <button type="button" onClick={onCancel} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: 4, background: 'white', cursor: 'pointer' }}>
          Cancel
        </button>
        <button type="submit" style={{ padding: '8px 16px', border: 'none', borderRadius: 4, background: '#48bb78', color: 'white', cursor: 'pointer' }}>
          Create Academic Year
        </button>
      </div>
    </form>
  );
}
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    start_date: initialData.start_date || '',
    end_date: initialData.end_date || '',
    is_active: initialData.is_active || false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormField label="Academic Year Name" required>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g. 2024-2025"
          style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
          required
        />
      </FormField>

      <FormField label="Start Date" required>
        <input
          type="date"
          value={formData.start_date}
          onChange={(e) => handleChange('start_date', e.target.value)}
          style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
          required
        />
      </FormField>

      <FormField label="End Date" required>
        <input
          type="date"
          value={formData.end_date}
          onChange={(e) => handleChange('end_date', e.target.value)}
          style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
          required
        />
      </FormField>

      <FormField label="Settings">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => handleChange('is_active', e.target.checked)}
          />
          <span>Set as Active Academic Year</span>
        </label>
      </FormField>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
        <button type="submit" style={{ padding: '8px 16px', border: 'none', borderRadius: 4, background: '#667eea', color: 'white', cursor: 'pointer' }}>
          Create Classroom
        </button>
      </div>
    </form>
  );
}

// Export all forms as default exports for easy importing
export default function AcademicYearForm(props) {
  return <AcademicYearForm {...props} />;
}

export { SubjectForm, ClassroomForm };>
        <button type="submit" style={{ padding: '8px 16px', border: 'none', borderRadius: 4, background: '#48bb78', color: 'white', cursor: 'pointer' }}>
          Create Academic Year
        </button>
      </div>
    </form>
  );
}