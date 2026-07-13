import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5001/api/users';

  private usersSignal = signal<User[]>([]);
  readonly users = this.usersSignal.asReadonly();

  // Load all users from the backend microservice
  loadUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl).pipe(
      tap(users => this.usersSignal.set(users))
    );
  }

  getUsers(): User[] {
    return this.usersSignal();
  }

  // Create a new user in the backend
  addUser(user: Omit<User, 'id'>): Observable<User> {
    return this.http.post<User>(this.apiUrl, user).pipe(
      tap(() => this.loadUsers().subscribe())
    );
  }

  // Delete a user in the backend
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loadUsers().subscribe())
    );
  }

  // Update a user in the backend
  updateUser(user: User): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${user.id}`, user).pipe(
      tap(() => this.loadUsers().subscribe())
    );
  }

  // Set users signal directly (fallback/cache update)
  setUsers(users: User[]): void {
    this.usersSignal.set(users);
  }
}
