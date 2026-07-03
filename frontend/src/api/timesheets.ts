import client from './client';
import type { Timesheet } from '../types/models';

export const getTimesheets = () =>
  client.get<Timesheet[]>('/timesheets/').then((r) => r.data);

export const getTimesheet = (id: number) =>
  client.get<Timesheet>(`/timesheets/${id}/`).then((r) => r.data);

export const createTimesheet = (data: Partial<Timesheet>) =>
  client.post<Timesheet>('/timesheets/', data).then((r) => r.data);

export const updateTimesheet = (id: number, data: Partial<Timesheet>) =>
  client.patch<Timesheet>(`/timesheets/${id}/`, data).then((r) => r.data);

export const deleteTimesheet = (id: number) =>
  client.delete(`/timesheets/${id}/`);

export const getMonthlyReportData = (year: number, month: number, employeeId?: number) => {
  let url = `/timesheets/monthly-report/?year=${year}&month=${month}`;
  if (employeeId) url += `&employee_id=${employeeId}`;
  return client.get<Timesheet[]>(url).then((r) => r.data);
};

export const downloadMonthlyReportCsv = async (year: number, month: number, employeeId?: number) => {
  let url = `/timesheets/monthly-report/?year=${year}&month=${month}&export=csv`;
  if (employeeId) url += `&employee_id=${employeeId}`;
  const response = await client.get(url, { responseType: 'blob' });
  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', `timesheet-report-${year}-${String(month).padStart(2, '0')}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

