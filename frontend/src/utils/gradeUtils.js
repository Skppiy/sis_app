// frontend/src/components/admin/utils/gradeUtils.js
// Shared grade level logic used across components

export const GRADE_LEVELS = [
  { value: 'K', label: 'Kindergarten', shortLabel: 'K', isElementary: true, isMiddle: false, order: 0 },
  { value: '1', label: '1st Grade', shortLabel: '1st', isElementary: true, isMiddle: false, order: 1 },
  { value: '2', label: '2nd Grade', shortLabel: '2nd', isElementary: true, isMiddle: false, order: 2 },
  { value: '3', label: '3rd Grade', shortLabel: '3rd', isElementary: true, isMiddle: false, order: 3 },
  { value: '4', label: '4th Grade', shortLabel: '4th', isElementary: true, isMiddle: false, order: 4 },
  { value: '5', label: '5th Grade', shortLabel: '5th', isElementary: true, isMiddle: false, order: 5 },
  { value: '6', label: '6th Grade', shortLabel: '6th', isElementary: false, isMiddle: true, order: 6 },
  { value: '7', label: '7th Grade', shortLabel: '7th', isElementary: false, isMiddle: true, order: 7 },
  { value: '8', label: '8th Grade', shortLabel: '8th', isElementary: false, isMiddle: true, order: 8 }
];

export const ELEMENTARY_GRADES = GRADE_LEVELS.filter(g => g.isElementary);
export const MIDDLE_GRADES = GRADE_LEVELS.filter(g => g.isMiddle);

/**
 * Get grade level info by value
 * @param {string} value - Grade value (K, 1, 2, etc.)
 * @returns {object|null} Grade level object or null if not found
 */
export const getGradeInfo = (value) => {
  return GRADE_LEVELS.find(g => g.value === value) || null;
};

/**
 * Get display label for grade level
 * @param {string} value - Grade value
 * @param {boolean} short - Use short label if true
 * @returns {string} Display label
 */
export const getGradeLabel = (value, short = false) => {
  const grade = getGradeInfo(value);
  if (!grade) return value || 'Unknown';
  return short ? grade.shortLabel : grade.label;
};

/**
 * Check if grade level is elementary
 * @param {string} value - Grade value
 * @returns {boolean}
 */
export const isElementaryGrade = (value) => {
  const grade = getGradeInfo(value);
  return grade ? grade.isElementary : false;
};

/**
 * Check if grade level is middle school
 * @param {string} value - Grade value
 * @returns {boolean}
 */
export const isMiddleGrade = (value) => {
  const grade = getGradeInfo(value);
  return grade ? grade.isMiddle : false;
};

/**
 * Sort grades in logical order (K, 1, 2, ..., 8)
 * @param {array} grades - Array of grade values or objects with grade_level property
 * @param {string} property - Property name for grade level if objects (default: 'grade_level')
 * @returns {array} Sorted grades
 */
export const sortGrades = (grades, property = 'grade_level') => {
  return grades.sort((a, b) => {
    const gradeA = typeof a === 'string' ? a : a[property];
    const gradeB = typeof b === 'string' ? b : b[property];
    
    const infoA = getGradeInfo(gradeA);
    const infoB = getGradeInfo(gradeB);
    
    if (!infoA && !infoB) return 0;
    if (!infoA) return 1;
    if (!infoB) return -1;
    
    return infoA.order - infoB.order;
  });
};

/**
 * Get applicable grades for a subject based on its settings
 * @param {object} subject - Subject object with applies_to_elementary and applies_to_middle
 * @returns {array} Array of applicable grade level objects
 */
export const getApplicableGrades = (subject) => {
  if (!subject) return [];
  
  let grades = [];
  if (subject.applies_to_elementary) {
    grades = grades.concat(ELEMENTARY_GRADES);
  }
  if (subject.applies_to_middle) {
    grades = grades.concat(MIDDLE_GRADES);
  }
  
  return grades;
};

/**
 * Format grade range display
 * @param {boolean} elementary - Applies to elementary
 * @param {boolean} middle - Applies to middle school
 * @returns {string} Formatted range (e.g., "K-8", "K-5", "6-8")
 */
export const formatGradeRange = (elementary, middle) => {
  if (elementary && middle) return 'K-8';
  if (elementary) return 'K-5';
  if (middle) return '6-8';
  return 'None';
};

/**
 * Validate grade level value
 * @param {string} value - Grade value to validate
 * @returns {boolean} True if valid grade level
 */
export const isValidGrade = (value) => {
  return GRADE_LEVELS.some(g => g.value === value);
};