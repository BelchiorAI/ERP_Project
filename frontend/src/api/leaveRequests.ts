import client from './client';
import type { LeaveRequest } from '../types/models';

export const getLeaveRequests = () =>
  client.get<LeaveRequest[]>('/leave-requests/').then((r) => r.data);

export const getLeaveRequest = (id: number) =>
  client.get<LeaveRequest>(`/leave-requests/${id}/`).then((r) => r.data);

export const createLeaveRequest = (data: Partial<LeaveRequest>) =>
  client.post<LeaveRequest>('/leave-requests/', data).then((r) => r.data);

export const updateLeaveRequest = (id: number, data: Partial<LeaveRequest>) =>
  client.patch<LeaveRequest>(`/leave-requests/${id}/`, data).then((r) => r.data);

export const deleteLeaveRequest = (id: number) =>
  client.delete(`/leave-requests/${id}/`);
