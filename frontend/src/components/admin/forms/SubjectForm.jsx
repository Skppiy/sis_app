// frontend/src/components/admin/forms/SubjectForm.jsx
// Subject creation form

export function SubjectForm({ initialData = {}, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
      name: initialData.name || '',
      code: initialData.code || '',
      subject_type: initialData.subject_type || 'ENRICHMENT',
      applies_to_elementary: initialData.applies_to_elementary || true,
      applies_to_middle: initialData.applies_to_middle || true,
      is_homeroom_default: initialData.is_homeroom_default || false,
      requires_specialist: initialData.requires_specialist || false
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
        <FormField label="Subject Name" required>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g. Spanish"
            style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
            required
          />
        </FormField>
  
        <FormField label="Subject Code" required>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
            placeholder="e.g. SPAN"
            style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
            required
          />
        </FormField>
  
        <FormField label="Subject Type">
          <select
            value={formData.subject_type}
            onChange={(e) => handleChange('subject_type', e.target.value)}
            style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
          >
            <option value="CORE">Core (Auto-assigns to elementary)</option>
            <option value="ENRICHMENT">Enrichment (Requires specialist)</option>
            <option value="SPECIAL">Special Services</option>
          </select>
        </FormField>
  
        <FormField label="Applies To">
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={formData.applies_to_elementary}
                onChange={(e) => handleChange('applies_to_elementary', e.target.checked)}
              />
              <span>Elementary (K-5)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={formData.applies_to_middle}
                onChange={(e) => handleChange('applies_to_middle', e.target.checked)}
              />
              <span>Middle School (6-8)</span>
            </label>
          </div>
        </FormField>
  
        <FormField label="Assignment Settings">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={formData.is_homeroom_default}
                onChange={(e) => handleChange('is_homeroom_default', e.target.checked)}
              />
              <span>Auto-assign to elementary homeroom teachers</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={formData.requires_specialist}
                onChange={(e) => handleChange('requires_specialist', e.target.checked)}
              />
              <span>Requires specialist teacher</span>
            </label>
          </div>
        </FormField>
  
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
          <button type="button" onClick={onCancel} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: 4, background: 'white', cursor: 'pointer' }}>
            Cancel
          </button>
          <button type="submit" style={{ padding: '8px 16px', border: 'none', borderRadius: 4, background: '#667eea', color: 'white', cursor: 'pointer' }}>
            Create Subject
          </button>
        </div>
      </form>
    );
  }