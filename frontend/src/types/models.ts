// TypeScript interfaces matching Django models
export interface Employee {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  job_title: string;
  department: string;
  hire_date: string;
  employment_status: 'active' | 'on_leave' | 'terminated';
  role: 'admin' | 'manager' | 'employee';
  can_create_users: boolean;
  manager: number | null;
}

export interface Timesheet {
  id: number;
  employee: number;
  employee_detail: Pick<Employee, 'id' | 'username' | 'first_name' | 'last_name'>;
  work_date: string;
  clock_in: string;
  clock_out: string | null;
  hours_worked: string | null;
  task_description: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface LeaveRequest {
  id: number;
  employee: number;
  employee_detail: Pick<Employee, 'id' | 'username' | 'first_name' | 'last_name'>;
  leave_type: 'sick' | 'vacation' | 'personal';
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  decided_at: string | null;
  manager_notes: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
