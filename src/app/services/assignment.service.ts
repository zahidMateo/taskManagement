import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { UserService } from './user.service';
import { WorkItemService } from './work-item.service';
import { AssignmentLog, WorkItem } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {
  private http = inject(HttpClient);
  private userService = inject(UserService);
  private workItemService = inject(WorkItemService);

  private readonly workItemsUrl = 'http://localhost:5002/api/workitems';
  private readonly usersUrl = 'http://localhost:5001/api/users';

  private logsSignal = signal<AssignmentLog[]>([]);
  readonly logs = this.logsSignal.asReadonly();

  getLogs(): AssignmentLog[] {
    return this.logsSignal();
  }

  clearLogs(): void {
    this.logsSignal.set([]);
  }

  // Clear and seed the C# backend database with the initial scenario setup
  loadExampleScenario(): Observable<any> {
    // 1. Get current work items and delete them
    return this.http.get<WorkItem[]>(this.workItemsUrl).pipe(
      switchMap(items => {
        const deleteTasks = items.map(item => this.http.delete(`${this.workItemsUrl}/${item.id}`));
        return deleteTasks.length > 0 ? forkJoin(deleteTasks) : of([]);
      }),
      // 2. Clear all users
      switchMap(() => this.http.get<any[]>(this.usersUrl)),
      switchMap(users => {
        const deleteUsers = users.map(user => this.http.delete(`${this.usersUrl}/${user.id}`));
        return deleteUsers.length > 0 ? forkJoin(deleteUsers) : of([]);
      }),
      // 3. Create initial users (A and B)
      switchMap(() => forkJoin([
        this.http.post(this.usersUrl, { id: 'usr-a', name: 'Usuario A', email: 'usuario.a@correo.com', role: 'Desarrollador Senior' }),
        this.http.post(this.usersUrl, { id: 'usr-b', name: 'Usuario B', email: 'usuario.b@correo.com', role: 'Desarrollador Junior' })
      ])),
      // 4. Reload users to get latest state
      switchMap(() => this.userService.loadUsers()),
      // 5. Create 4 pre-existing items assigned to A and B
      switchMap(users => {
        const dateFarStr = this.getFormattedDate(10);
        const dateNearStr = this.getFormattedDate(2);
        
        const userA = users.find(u => u.name.includes('Usuario A')) || users[0];
        const userB = users.find(u => u.name.includes('Usuario B')) || users[1];

        const task1 = { title: 'Desarrollar API de Ítems de Trabajo', description: 'Construir el controlador REST y lógica.', isRelevant: true, dueDate: dateFarStr, assignedUserId: userA.id, status: 'Assigned' };
        const task2 = { title: 'Desarrollar API de Gestión de Usuarios', description: 'Construir endpoint de autenticación.', isRelevant: true, dueDate: dateFarStr, assignedUserId: userA.id, status: 'Assigned' };
        const task3 = { title: 'Optimización de consultas SQL', description: 'Creación de índices y tuneo.', isRelevant: false, dueDate: dateFarStr, assignedUserId: userA.id, status: 'Assigned' };
        const task4 = { title: 'Corregir error de CORS en desarrollo', description: 'Configurar middleware de CORS.', isRelevant: false, dueDate: dateFarStr, assignedUserId: userB.id, status: 'Assigned' };
        const task5 = { title: 'Nuevo Ítem de Trabajo Crítico (Enunciado)', description: 'Ítem altamente relevante con fecha de vencimiento próxima (2 días).', isRelevant: true, dueDate: dateNearStr, assignedUserId: null, status: 'Pending' };

        return forkJoin([
          this.http.post(this.workItemsUrl, task1),
          this.http.post(this.workItemsUrl, task2),
          this.http.post(this.workItemsUrl, task3),
          this.http.post(this.workItemsUrl, task4),
          this.http.post(this.workItemsUrl, task5)
        ]);
      }),
      // 6. Refresh final local data cache
      switchMap(() => forkJoin([
        this.userService.loadUsers(),
        this.workItemService.loadWorkItems()
      ])),
      tap(() => {
        this.clearLogs();
        this.addLog({
          workItemId: 'setup',
          workItemTitle: 'Inicialización de Escenario',
          assignedUserId: null,
          assignedUserName: null,
          ruleApplied: 'Configuración Inicial',
          details: 'Se restableció y semilló la base de datos de los microservicios backend: Usuario A (3 tareas activas) y Usuario B (1 tarea activa).'
        });
      })
    );
  }

  private getFormattedDate(daysOffset: number): string {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  }

  // Trigger the auto-assign endpoint in the backend for a specific item
  assignAutomatically(item: WorkItem): Observable<any> {
    return this.http.post<WorkItem>(`${this.workItemsUrl}/${item.id}/auto-assign`, {}).pipe(
      switchMap(updatedItem => {
        return forkJoin([
          this.userService.loadUsers(),
          this.workItemService.loadWorkItems()
        ]).pipe(
          tap(([users]) => {
            const assignedUser = users.find(u => u.id === updatedItem.assignedUserId);
            
            // Deduce rule applied for UI Logging purposes
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const due = new Date(item.dueDate + 'T00:00:00');
            const diffTime = due.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            const isUrgent = diffDays >= 0 && diffDays <= 2;
            const ruleApplied = isUrgent 
              ? 'Regla 1: Vencimiento Próximo (Urgente)' 
              : (item.isRelevant ? 'Regla 2: Ítem Relevante' : 'Regla 3: Asignación por Defecto');

            this.addLog({
              workItemId: updatedItem.id,
              workItemTitle: updatedItem.title,
              assignedUserId: updatedItem.assignedUserId,
              assignedUserName: assignedUser ? assignedUser.name : 'Usuario',
              ruleApplied,
              details: `Auto-asignación procesada por el backend. Tarea asignada a: "${assignedUser ? assignedUser.name : 'ID ' + updatedItem.assignedUserId}".`
            });
          })
        );
      })
    );
  }

  private addLog(log: Omit<AssignmentLog, 'id' | 'timestamp'>): void {
    const newLog: AssignmentLog = {
      ...log,
      id: 'log-' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date()
    };
    this.logsSignal.update(l => [newLog, ...l]);
  }
}
