import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WorkItem } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class WorkItemService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5002/api/workitems';

  private workItemsSignal = signal<WorkItem[]>([]);
  readonly workItems = this.workItemsSignal.asReadonly();

  // Load all work items from the backend microservice
  loadWorkItems(): Observable<WorkItem[]> {
    return this.http.get<WorkItem[]>(this.apiUrl).pipe(
      tap(items => this.workItemsSignal.set(items))
    );
  }

  getWorkItems(): WorkItem[] {
    return this.workItemsSignal();
  }

  // Create a new work item (unassigned)
  addWorkItem(item: Omit<WorkItem, 'id' | 'assignedUserId' | 'status'> & { assignedUserId?: string | null; status?: WorkItem['status'] }): Observable<WorkItem> {
    return this.http.post<WorkItem>(this.apiUrl, item).pipe(
      tap(() => this.loadWorkItems().subscribe())
    );
  }

  // Update details of a work item
  updateWorkItem(updatedItem: WorkItem): Observable<WorkItem> {
    return this.http.put<WorkItem>(`${this.apiUrl}/${updatedItem.id}`, updatedItem).pipe(
      tap(() => this.loadWorkItems().subscribe())
    );
  }

  // Delete a work item
  deleteWorkItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loadWorkItems().subscribe())
    );
  }

  // Manual assignment: Send user ID in the request body
  assignWorkItem(itemId: string, userId: string | null): Observable<void> {
    // Send user ID in body as JSON string or object
    const payload = userId ? { userId } : { userId: null };
    return this.http.post<void>(`${this.apiUrl}/${itemId}/assign-to-user`, payload).pipe(
      tap(() => this.loadWorkItems().subscribe())
    );
  }

  // Set work items signal directly (fallback/cache update)
  setWorkItems(items: WorkItem[]): void {
    this.workItemsSignal.set(items);
  }
}
