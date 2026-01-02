export interface PlannedModule {
  id: string;
  code: string;
  name: string;
  au: number;
  year: number;
  semester: 1 | 2 | 3 | 4;
  grade?: string | null;
  remarks?: string | null;
  prerequisites?: string | { text?: string } | Record<string, unknown> | null;
  isAvailable?: boolean;
}

export const SEMESTER_LABELS: Record<number, string> = {
  1: "Semester 1",
  2: "Semester 2", 
  3: "Winter",
  4: "Summer"
};

export const YEARS = [1, 2, 3, 4, 5, 6];

export const GRADE_OPTIONS = [
  { grade: "NOT_GRADED", points: null, display: "Grade" }, 
  { grade: "A+", points: 5.0, display: "A+" },
  { grade: "A", points: 5.0, display: "A" },
  { grade: "A-", points: 4.5, display: "A-" },
  { grade: "B+", points: 4.0, display: "B+" },
  { grade: "B", points: 3.5, display: "B" },
  { grade: "B-", points: 3.0, display: "B-" },
  { grade: "C+", points: 2.5, display: "C+" },
  { grade: "C", points: 2.0, display: "C" },
  { grade: "D+", points: 1.5, display: "D+" },
  { grade: "D", points: 1.0, display: "D" },
  { grade: "Fail", points: 0.0, display: "Fail" },
  { grade: "Pass", points: null, display: "Pass" }, 
  { grade: "NR", points: null, display: "NR" }, 
  { grade: "IP", points: null, display: "IP" }, 
  { grade: "LOA", points: null, display: "LOA" }, 
  { grade: "EX", points: null, display: "EX" }, 
  { grade: "TC", points: null, display: "TC" }, 
];

export const formatYear = (year: number): string => {
  return `Year ${year}`;
};

export const getSemesterColor = (semester: number): string => {
  const colors: Record<number, string> = {
    1: '#E6F3FF', 
    2: '#FFE6F0', 
    3: '#E6FFE6', 
    4: '#FFF9E6', 
  };
  return colors[semester] || '#F5F5F5';
};

export const getGradePoints = (grade?: string | null): number | null => {
  if (!grade) return null;
  const gradeOption = GRADE_OPTIONS.find(g => g.grade === grade);
  return gradeOption?.points ?? null;
};

export const countsTowardsGPA = (grade?: string | null): boolean => {
  if (!grade) return false;
  const points = getGradePoints(grade);
  return points !== null;
};

export const calculateGPA = (modules: PlannedModule[]): { gpa: number; totalAU: number; countedAU: number } => {
  let totalPoints = 0;
  let countedAU = 0;
  let totalAU = 0;

  modules.forEach(module => {
    totalAU += module.au;
    if (countsTowardsGPA(module.grade)) {
      const points = getGradePoints(module.grade);
      if (points !== null) {
        totalPoints += points * module.au;
        countedAU += module.au;
      }
    }
  });

  const gpa = countedAU > 0 ? totalPoints / countedAU : 0;
  return { gpa, totalAU, countedAU };
};

export const formatSemesterLabel = (sem: string): string => {
  if (!sem) return "";
  const parts = sem.split('_');
  if (parts.length < 2) return sem;
  const year = parseInt(parts[0]);
  const suffix = parts[1];
  const semester = parseInt(suffix);

  const semLabel = !isNaN(semester)
    ? (SEMESTER_LABELS[semester] || `Semester ${semester}`)
    : (suffix === 'S' ? 'Special Term' : `Semester ${suffix}`);

  return `AY${year}/${year + 1} ${semLabel}`;
};

export const exportToCSV = (modules: PlannedModule[], filename: string = 'course_plan.csv') => {
  const headers = ['Module Code', 'Title', 'Prerequisites', 'AU', 'Grade', 'Remarks', 'Year', 'Semester'];
  const rows = modules.map(m => {
    let prereqString = '';
    if (m.prerequisites) {
      if (typeof m.prerequisites === 'object') {
        if ('text' in m.prerequisites && typeof m.prerequisites.text === 'string') {
          prereqString = m.prerequisites.text;
        } else {
          prereqString = JSON.stringify(m.prerequisites);
        }
      } else {
        prereqString = m.prerequisites as string;
      }
    }
    
    return [
      m.code,
      m.name,
      prereqString,
      m.au.toString(),
      m.grade || '',
      m.remarks || '',
      m.year.toString(),
      m.semester.toString()
    ];
  });
  
  const csvRows = rows.map(row => 
    row.map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(',')
  );
  
  const csvContentBlob = new Blob([[headers.join(','), '\n', ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(csvContentBlob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const importFromCSV = async (file: File): Promise<PlannedModule[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvContent = event.target?.result as string;
        const lines = csvContent.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length === 0) {
          resolve([]);
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '')); // Remove quotes
        const requiredHeaders = ['Module Code', 'Title', 'Prerequisites', 'AU', 'Grade', 'Remarks', 'Year', 'Semester'];
        
        const missingHeaders = requiredHeaders.filter(rh => !headers.includes(rh));
        if (missingHeaders.length > 0) {
          throw new Error(`Missing required CSV headers: ${missingHeaders.join(', ')}`);
        }

        const modules: PlannedModule[] = [];
        for (let i = 1; i < lines.length; i++) {
          const rawValues = lines[i].match(/(?:"[^"]*"|[^,])+/g); // Robustly split CSV by comma, handling quoted fields
          if (!rawValues) continue;

          const values = rawValues.map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"')); // Clean up quotes and escape

          const rowData: Record<string, string> = {};
          headers.forEach((header, index) => {
            rowData[header] = values[index];
          });
          
          const year = parseInt(rowData['Year']) || 1;
          const semester = (parseInt(rowData['Semester']) || 1) as 1 | 2 | 3 | 4;

          modules.push({
            id: crypto.randomUUID(), // Generate a new ID for imported modules
            code: rowData['Module Code'],
            name: rowData['Title'],
            au: parseFloat(rowData['AU']) || 0,
            year,
            semester,
            grade: rowData['Grade'] || undefined,
            remarks: rowData['Remarks'] || undefined,
            prerequisites: rowData['Prerequisites'] || undefined,
            isAvailable: true // Assuming imported modules are available
          });
        }
        resolve(modules);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        reject(new Error(`Failed to parse CSV: ${message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file."));
    };

    reader.readAsText(file);
  });
};
