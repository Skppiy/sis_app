// frontend/src/components/admin/forms/ClassroomForm.jsx
// Classroom creation form

export function ClassroomForm({ subjects = [], initialData = {}, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    grade_level: initialData.grade_level || '',
    subject_id: initialData.subject_id || '',
    classroom_type: initialData.classroom_type || 'CORE',
    max_students: initialData.max_students || 25
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const gradeLevels = [
    { value: 'K', label: 'Kindergarten' },
    { value: '1', label: '1st Grade' },
    { value: '2', label: '2nd Grade' },
    { value: '3', label: '3rd Grade' },
    { value: '4', label: '4th Grade' },
    { value: '5', label: '5th Grade' },
    { value: '6', label: '6th Grade' },
    { value: '7', label: '7th Grade' },
    { value: '8', label: '8th Grade' }
  ];

  return (
    <form onSubmit={handleSubmit}>
      <FormField label="Classroom Name" required>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g. 3rd Grade Homeroom - Mrs. Johnson"
          style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
          required
        />
      </FormField>

      <FormField label="Grade Level" required>
        <select
          value={formData.grade_level}
          onChange={(e) => handleChange('grade_level', e.target.value)}
          style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
          required
        >
          <option value="">Select Grade Level</option>
          {gradeLevels.map(grade => (
            <option key={grade.value} value={grade.value}>
              {grade.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Subject" required>
        <select
          value={formData.subject_id}
          onChange={(e) => handleChange('subject_id', e.target.value)}
          style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
          required
        >
          <option value="">Select Subject</option>
          {subjects.map(subject => (
            <option key={subject.id} value={subject.id}>
              {subject.name} ({subject.code})
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Classroom Type">
        <select
          value={formData.classroom_type}
          onChange={(e) => handleChange('classroom_type', e.target.value)}
          style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
        >
          <option value="CORE">Core</option>
          <option value="ENRICHMENT">Enrichment</option>
          <option value="SPECIAL">Special</option>
        </select>
      </FormField>

      <FormField label="Maximum Students">
        <input
          type="number"
          value={formData.max_students}
          onChange={(e) => handleChange('max_students', parseInt(e.target.value))}
          min="1"
          max="50"
          style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
        />
      </FormField>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
        <button type="button" onClick={onCancel} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: 4, background: 'white', cursor: 'pointer' }}>
          Cancel
        </button