import { StudentAttendance } from '../types';

export const SAMPLE_DATES = [
  '23/01/2026',
  '30/01/2026',
  '17/04/2026',
  '24/04/2026',
  '22/05/2026',
  '29/05/2026',
  '05/06/2026',
  '12/06/2026',
  '19/06/2026'
];

export const SAMPLE_STUDENTS: StudentAttendance[] = [
  {
    id: 'student-1',
    no: 1,
    nama: 'QONITA JIHAN FAKHRIYAH',
    kelas: 'X - B',
    ekstra: 'Bahasa Arab',
    attendance: {
      '23/01/2026': '-',
      '30/01/2026': 'H',
      '17/04/2026': 'H',
      '24/04/2026': '-',
      '22/05/2026': 'A',
      '29/05/2026': '-',
      '05/06/2026': 'H',
      '12/06/2026': 'H',
      '19/06/2026': '-'
    }
  },
  {
    id: 'student-2',
    no: 2,
    nama: 'ARINA NAMAIKA',
    kelas: 'X - C',
    ekstra: 'Bahasa Arab',
    attendance: {
      '23/01/2026': '-',
      '30/01/2026': 'H',
      '17/04/2026': 'H',
      '24/04/2026': '-',
      '22/05/2026': 'H',
      '29/05/2026': '-',
      '05/06/2026': 'A',
      '12/06/2026': 'A',
      '19/06/2026': '-'
    }
  },
  {
    id: 'student-3',
    no: 3,
    nama: 'AHMAD NAUFAL BUSTOMI',
    kelas: 'X - A',
    ekstra: 'Bahasa Arab',
    attendance: {
      '23/01/2026': 'H',
      '30/01/2026': 'H',
      '17/04/2026': 'S',
      '24/04/2026': 'H',
      '22/05/2026': 'H',
      '29/05/2026': 'H',
      '05/06/2026': 'H',
      '12/06/2026': 'I',
      '19/06/2026': 'H'
    }
  },
  {
    id: 'student-4',
    no: 4,
    nama: 'FATHIR AL-GHIFARI',
    kelas: 'X - B',
    ekstra: 'Pramuka',
    attendance: {
      '23/01/2026': 'H',
      '30/01/2026': 'I',
      '17/04/2026': 'H',
      '24/04/2026': 'H',
      '22/05/2026': 'H',
      '29/05/2026': 'A',
      '05/06/2026': 'H',
      '12/06/2026': 'H',
      '19/06/2026': 'H'
    }
  },
  {
    id: 'student-5',
    no: 5,
    nama: 'MUTIA AZZAHRA',
    kelas: 'XI - IPA 1',
    ekstra: 'Pramuka',
    attendance: {
      '23/01/2026': 'H',
      '30/01/2026': 'H',
      '17/04/2026': 'H',
      '24/04/2026': 'H',
      '22/05/2026': 'H',
      '29/05/2026': 'H',
      '05/06/2026': 'H',
      '12/06/2026': 'H',
      '19/06/2026': 'H'
    }
  },
  {
    id: 'student-6',
    no: 6,
    nama: 'RAIHAN SYAHPUTRA',
    kelas: 'XI - IPS 2',
    ekstra: 'Robotik',
    attendance: {
      '23/01/2026': 'H',
      '30/01/2026': 'H',
      '17/04/2026': 'A',
      '24/04/2026': 'A',
      '22/05/2026': 'H',
      '29/05/2026': 'S',
      '05/06/2026': 'H',
      '12/06/2026': 'H',
      '19/06/2026': 'H'
    }
  }
];
