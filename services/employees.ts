import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Employee } from '@/types';
import { QUERY_LIMITS } from '@/lib/firestore-helpers';

/**
 * Get employees with optional limit
 * @param companyId - Company ID
 * @param maxResults - Maximum number of results (default: 100)
 * @returns Array of employees sorted by name
 */
export async function getEmployees(companyId: string, maxResults: number = QUERY_LIMITS.CUSTOMERS): Promise<Employee[]> {
  const employeesRef = collection(db, `companies/${companyId}/employees`);
  const q = query(employeesRef, orderBy('name'), limit(maxResults));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Employee[];
}

/**
 * Get active employees
 * @param companyId - Company ID
 * @param maxResults - Maximum number of results (default: 100)
 * @returns Array of active employees
 */
export async function getActiveEmployees(companyId: string, maxResults: number = QUERY_LIMITS.CUSTOMERS): Promise<Employee[]> {
  const employeesRef = collection(db, `companies/${companyId}/employees`);
  const q = query(employeesRef, where('isActive', '==', true), orderBy('name'), limit(maxResults));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Employee[];
}

export async function getEmployeeById(companyId: string, employeeId: string): Promise<Employee | null> {
  const employeeRef = doc(db, `companies/${companyId}/employees`, employeeId);
  const snapshot = await getDoc(employeeRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Employee;
}

export async function findEmployeeByName(companyId: string, name: string): Promise<Employee | null> {
  const employeesRef = collection(db, `companies/${companyId}/employees`);
  const q = query(employeesRef, where('name', '==', name));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as Employee;
}

export async function findEmployeeByEmployeeId(companyId: string, employeeId: string): Promise<Employee | null> {
  const employeesRef = collection(db, `companies/${companyId}/employees`);
  const q = query(employeesRef, where('employeeId', '==', employeeId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as Employee;
}

export async function generateEmployeeId(companyId: string): Promise<string> {
  const employees = await getEmployees(companyId);
  const nextNumber = employees.length + 1;
  return `EMP${nextNumber.toString().padStart(3, '0')}`;
}

export async function createEmployee(
  companyId: string,
  data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const employeesRef = collection(db, `companies/${companyId}/employees`);

  // Generate employee ID if not provided
  const employeeId = data.employeeId || await generateEmployeeId(companyId);

  const docRef = await addDoc(employeesRef, {
    ...data,
    employeeId,
    isActive: data.isActive ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateEmployee(
  companyId: string,
  employeeDocId: string,
  data: Partial<Employee>
): Promise<void> {
  const employeeRef = doc(db, `companies/${companyId}/employees`, employeeDocId);
  await updateDoc(employeeRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deactivateEmployee(companyId: string, employeeDocId: string): Promise<void> {
  await updateEmployee(companyId, employeeDocId, { isActive: false });
}

export async function activateEmployee(companyId: string, employeeDocId: string): Promise<void> {
  await updateEmployee(companyId, employeeDocId, { isActive: true });
}

export async function deleteEmployee(companyId: string, employeeDocId: string): Promise<void> {
  const employeeRef = doc(db, `companies/${companyId}/employees`, employeeDocId);
  await deleteDoc(employeeRef);
}

export async function getEmployeesByDepartment(companyId: string, department: string): Promise<Employee[]> {
  const employeesRef = collection(db, `companies/${companyId}/employees`);
  const q = query(employeesRef, where('department', '==', department), where('isActive', '==', true));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Employee[];
}

export async function getTotalMonthlyPayroll(companyId: string): Promise<number> {
  const activeEmployees = await getActiveEmployees(companyId);
  return activeEmployees.reduce((total, emp) => {
    if (emp.salaryType === 'monthly') {
      return total + emp.salary;
    }
    // Assume 160 hours per month for hourly employees
    return total + (emp.salary * 160);
  }, 0);
}
