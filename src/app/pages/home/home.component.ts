import {
  Component,
  Injector,
  signal,
  computed,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { Task } from '../../models/task.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],

  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  tasks = signal<Task[]>([]);
  filter = signal<'all' | 'pending' | 'completed'>('all');

  changeFilter(filter: 'all' | 'pending' | 'completed') {
    this.filter.set(filter);
  }
  taskByFilter = computed(() => {
    const filter = this.filter();
    const tasks = this.tasks();
    if (filter === 'pending') {
      return tasks.filter((t) => !t.completed);
    }
    if (filter === 'completed') {
      return tasks.filter((t) => t.completed);
    }
    return tasks;
  });

  newTaskCtrl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(4)],
  });

  changeHandler() {
    if (this.newTaskCtrl.valid) {
      const value = this.newTaskCtrl.value.trim();

      if (value !== '') {
        this.addTask(value);
        this.newTaskCtrl.setValue('');
      }
    }
  }

  addTask(title: string) {
    const newTask: Task = {
      id: Date.now(),
      title,
      completed: false,
    };
    this.tasks.update((tasks) => [...tasks, newTask]);
  }

  deleteTask(index: number) {
    this.tasks.update((tasks) => tasks.filter((_, i) => i !== index));
  }

  updateTask(index: number) {
    this.tasks.update((tasks) => {
      return tasks.map((t, i) => {
        if (i === index) {
          return {
            ...t,
            completed: !t.completed,
          };
        }
        return t;
      });
    });
  }

  updateTaskEditingMode(index: number) {
    this.tasks.update((tasks) => {
      return tasks.map((t, i) => {
        if (i === index) {
          return {
            ...t,
            editing: true,
          };
        }
        return {
          ...t,
          editing: false,
        };
      });
    });
  }

  updateText(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    this.tasks.update((tasks) => {
      return tasks.map((t, i) => {
        if (i === index) {
          return {
            ...t,
            title: input.value,
            editing: false,
          };
        }
        return t;
      });
    });
  }

  injector = inject(Injector);

  ngOnInit() {
    const storage = localStorage.getItem('tasks');
    if (storage) {
      const tasks = JSON.parse(storage);
      this.tasks.set(tasks);
    }
    this.trackTasks();
  }

  trackTasks() {
    effect(
      () => {
        const tasks = this.tasks();
        localStorage.setItem('tasks', JSON.stringify(tasks));
      },
      {
        injector: this.injector,
      }
    );
  }
}
