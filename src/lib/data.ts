import fs from 'fs';
import path from 'path';
import type { AppState } from './types';

const DATA_FILE = path.join(process.cwd(), 'data', 'todoslot.json');

const DEFAULT_STATE: AppState = {
  projects: [],
  tasks: [],
  routines: [],
  routineInstances: [],
  goalCompass: {
    identity: '',
    goals: {
      today: '',
      week: '',
      month: '',
      quarter: '',
      oneYear: '',
      fiveYear: '',
    },
    affirmation: '',
  },
  lastUsedProjectId: null,
  activeProjectFilter: null,
  projectFirstMode: true,
};

export function readData(): AppState {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      writeData(DEFAULT_STATE);
      return structuredClone(DEFAULT_STATE);
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as AppState;
  } catch {
    writeData(DEFAULT_STATE);
    return structuredClone(DEFAULT_STATE);
  }
}

export function writeData(data: AppState): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
