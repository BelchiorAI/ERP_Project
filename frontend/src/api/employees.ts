import client from './client';
import type { Employee } from '../types/models';

export const getEmployees = () =>
  client.get<Employee[]>('/employees/').then((r) => r.data);

export const getEmployee = (id: number) =>
  client.get<Employee>(`/employees/${id}/`).then((r) => r.data);

export const createEmployee = (data: Partial<Employee>) =>
  client.post<Employee>('/employees/', data).then((r) => r.data);

export const updateEmployee = (id: number, data: Partial<Employee>) =>
  client.patch<Employee>(`/employees/${id}/`, data).then((r) => r.data);

export const deleteEmployee = (id: number) =>
  client.delete(`/employees/${id}/`);
