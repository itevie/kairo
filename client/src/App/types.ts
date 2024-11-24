export interface Task {
  id: number;
  user: number;
  title: string;
  finished: boolean;
  created_at: string;
  due: string | null;
  repeat: number | null;
  in_group: number | null;
  note: string | null;
}

export interface Group {
  id: number;
  user: number;
  name: string;
  note: string | null;
  theme: string | null;
}

export interface MoodLog {
  id: number;
  user: number;
  emotion: string;
  note: string | null;
  created_at: string;
}
