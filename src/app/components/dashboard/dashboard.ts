import { Component, inject, signal, computed, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { WorkItemService } from '../../services/work-item.service';
import { AssignmentService } from '../../services/assignment.service';
import { User, WorkItem } from '../../models/types';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);

  // Inject services
  protected readonly userService = inject(UserService);
  protected readonly workItemService = inject(WorkItemService);
  protected readonly assignmentService = inject(AssignmentService);

  // Active view tab: 'overview' | 'users' | 'items'
  activeTab = signal<'overview' | 'users' | 'items'>('overview');

  // Forms states
  // New User Form
  newUser = signal({
    name: '',
    email: '',
    role: 'Desarrollador'
  });

  editingUser = signal<User | null>(null);

  // New Work Item Form
  newItem = signal({
    title: '',
    description: '',
    isRelevant: false,
    dueDate: '',
    assignedUserId: null as string | null
  });

  editingWorkItem = signal<WorkItem | null>(null);

  // Filters
  itemFilter = signal<'all' | 'Pending' | 'Assigned' | 'Completed'>('all');

  // Error States
  usersServiceError = signal<string | null>(null);
  workItemsServiceError = signal<string | null>(null);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadData();
    }
  }

  loadData(): void {
    // Load initial data from the backend APIs
    this.userService.loadUsers().subscribe({
      next: () => this.usersServiceError.set(null),
      error: (err) => this.handleError(err, 'users')
    });
    this.workItemService.loadWorkItems().subscribe({
      next: () => this.workItemsServiceError.set(null),
      error: (err) => this.handleError(err, 'workitems')
    });
  }

  clearUsersError(): void {
    this.usersServiceError.set(null);
  }

  clearWorkItemsError(): void {
    this.workItemsServiceError.set(null);
  }

  private handleError(err: any, service: 'users' | 'workitems'): void {
    console.error(`Error loading ${service}:`, err);
    let msg = 'Error desconocido de red.';
    if (err.status === 0) {
      const port = service === 'users' ? '5001' : '5002';
      msg = `Conexión rechazada (ECONNREFUSED). El microservicio en el puerto ${port} no está activo o CORS no está permitido.`;
    } else if (err.error && typeof err.error === 'string') {
      msg = err.error;
    } else if (err.message) {
      msg = err.message;
    }
    
    if (service === 'users') {
      this.usersServiceError.set(msg);
    } else {
      this.workItemsServiceError.set(msg);
    }
  }

  // Computed properties
  usersList = computed(() => this.userService.users());
  workItemsList = computed(() => this.workItemService.workItems());
  logsList = computed(() => this.assignmentService.logs());
  unassignedActiveItemsCount = computed(() =>
    this.workItemsList().filter(item => !item.assignedUserId && item.status !== 'Completed').length
  );

  filteredWorkItems = computed(() => {
    const items = this.workItemsList();
    const filter = this.itemFilter();
    if (filter === 'all') return items;
    return items.filter(item => item.status === filter);
  });

  // Get user assigned items count
  getUserActiveItemsCount(userId: string): number {
    return this.workItemsList().filter(
      item => item.assignedUserId === userId && item.status !== 'Completed'
    ).length;
  }

  // Get user details by ID
  getUserName(userId: string | null): string {
    if (!userId) return 'Sin asignar';
    const user = this.usersList().find(u => u.id === userId);
    return user ? user.name : 'Usuario Desconocido';
  }

  // Check if a work item is close to expiring (<= 2 days)
  isItemUrgent(item: WorkItem): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const datePart = item.dueDate.includes('T') ? item.dueDate.split('T')[0] : item.dueDate;
    const due = new Date(datePart + 'T00:00:00');
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 2;
  }

  // Days remaining for visual display
  getDaysRemaining(item: WorkItem): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const datePart = item.dueDate.includes('T') ? item.dueDate.split('T')[0] : item.dueDate;
    const due = new Date(datePart + 'T00:00:00');
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Actions
  onLoadExampleScenario(): void {
    this.assignmentService.loadExampleScenario().subscribe({
      next: () => {
        this.usersServiceError.set(null);
        this.workItemsServiceError.set(null);
      },
      error: (err) => {
        this.handleError(err, 'users');
        this.handleError(err, 'workitems');
      }
    });
  }

  onEditUser(user: User): void {
    this.editingUser.set(user);
    this.newUser.set({
      name: user.name,
      email: user.email,
      role: user.role
    });
  }

  onCancelEdit(): void {
    this.editingUser.set(null);
    this.newUser.set({
      name: '',
      email: '',
      role: 'Desarrollador'
    });
  }

  onSaveUser(): void {
    const data = this.newUser();
    if (!data.name || !data.email) return;

    const editUser = this.editingUser();
    if (editUser) {
      const updatedUser: User = {
        id: editUser.id,
        name: data.name,
        email: data.email,
        role: data.role
      };

      this.userService.updateUser(updatedUser).subscribe({
        next: () => {
          this.onCancelEdit();
          this.usersServiceError.set(null);
        },
        error: (err) => this.handleError(err, 'users')
      });
    } else {
      this.userService.addUser({
        name: data.name,
        email: data.email,
        role: data.role
      }).subscribe({
        next: () => {
          this.newUser.set({
            name: '',
            email: '',
            role: 'Desarrollador'
          });
          this.usersServiceError.set(null);
        },
        error: (err) => this.handleError(err, 'users')
      });
    }
  }

  onDeleteUser(userId: string): void {
    this.userService.deleteUser(userId).subscribe({
      next: () => this.usersServiceError.set(null),
      error: (err) => this.handleError(err, 'users')
    });
  }

  onEditWorkItem(item: WorkItem): void {
    this.editingWorkItem.set(item);
    const datePart = item.dueDate.includes('T') ? item.dueDate.split('T')[0] : item.dueDate;
    this.newItem.set({
      title: item.title,
      description: item.description,
      isRelevant: item.isRelevant,
      dueDate: datePart,
      assignedUserId: item.assignedUserId
    });
  }

  onCancelEditWorkItem(): void {
    this.editingWorkItem.set(null);
    this.newItem.set({
      title: '',
      description: '',
      isRelevant: false,
      dueDate: '',
      assignedUserId: null
    });
  }

  onCreateWorkItem(autoAssign: boolean): void {
    const data = this.newItem();
    if (!data.title || !data.dueDate) return;

    const editItem = this.editingWorkItem();
    if (editItem) {
      const targetUserId = autoAssign ? editItem.assignedUserId : (data.assignedUserId === 'null' || !data.assignedUserId ? null : data.assignedUserId);
      const updatedItem: WorkItem = {
        id: editItem.id,
        title: data.title,
        description: data.description,
        isRelevant: data.isRelevant,
        dueDate: data.dueDate,
        status: autoAssign ? editItem.status : (targetUserId ? 'Assigned' : 'Pending'),
        assignedUserId: targetUserId
      };

      this.workItemService.updateWorkItem(updatedItem).subscribe({
        next: (saved) => {
          this.workItemsServiceError.set(null);
          if (autoAssign) {
            this.assignmentService.assignAutomatically(saved).subscribe({
              next: () => this.workItemsServiceError.set(null),
              error: (err) => this.handleError(err, 'workitems')
            });
          }
          this.onCancelEditWorkItem();
        },
        error: (err) => this.handleError(err, 'workitems')
      });
    } else {
      const targetUserId = autoAssign ? null : (data.assignedUserId === 'null' || !data.assignedUserId ? null : data.assignedUserId);
      const initialStatus = targetUserId ? 'Assigned' : 'Pending';

      this.workItemService.addWorkItem({
        title: data.title,
        description: data.description,
        isRelevant: data.isRelevant,
        dueDate: data.dueDate,
        status: initialStatus as 'Pending' | 'Assigned',
        assignedUserId: targetUserId
      }).subscribe({
        next: (created) => {
          this.workItemsServiceError.set(null);
          if (autoAssign) {
            this.assignmentService.assignAutomatically(created).subscribe({
              next: () => this.workItemsServiceError.set(null),
              error: (err) => this.handleError(err, 'workitems')
            });
          }
          this.newItem.set({
            title: '',
            description: '',
            isRelevant: false,
            dueDate: '',
            assignedUserId: null
          });
        },
        error: (err) => this.handleError(err, 'workitems')
      });
    }
  }

  onAutoAssign(item: WorkItem): void {
    this.assignmentService.assignAutomatically(item).subscribe({
      next: () => this.workItemsServiceError.set(null),
      error: (err) => this.handleError(err, 'workitems')
    });
  }

  onCompleteWorkItem(item: WorkItem): void {
    const updated: WorkItem = {
      ...item,
      status: 'Completed'
    };
    this.workItemService.updateWorkItem(updated).subscribe({
      next: () => this.workItemsServiceError.set(null),
      error: (err) => this.handleError(err, 'workitems')
    });
  }

  onDeleteWorkItem(itemId: string): void {
    this.workItemService.deleteWorkItem(itemId).subscribe({
      next: () => this.workItemsServiceError.set(null),
      error: (err) => this.handleError(err, 'workitems')
    });
  }

  onClearLogs(): void {
    this.assignmentService.clearLogs();
  }

  // Helper to load Statement Scenario specific item
  onLoadSpecificStatementItem(): void {
    // Set form to the specific item: Highly relevant, expires in 2 days
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const dueDateStr = twoDaysFromNow.toISOString().split('T')[0];

    this.newItem.set({
      title: 'Nuevo Ítem de Trabajo Crítico (Enunciado)',
      description: 'Ítem altamente relevante con fecha de vencimiento próxima (2 días).',
      isRelevant: true,
      dueDate: dueDateStr,
      assignedUserId: null
    });
    
    // Switch to Overview/Simulator tab to see the form
    this.activeTab.set('overview');
  }
}
