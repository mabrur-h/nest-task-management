import { EntityRepository, Repository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskStatus } from './task-status.enum';
import { NotFoundException } from '@nestjs/common';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { User } from '../auth/users.entity';

@EntityRepository(Task)
export class TasksRepository extends Repository<Task> {
  async getTask(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
    const { search, status } = filterDto;

    const query = this.createQueryBuilder('task');
    query.where({ user });

    if (status) {
      query.andWhere(`task.status = :status`, { status });
    }

    if (search) {
      query.andWhere(
        `(LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.description) LIKE LOWER(:search))`,
        { search: `%${search}%` },
      );
    }

    const tasks = query.getMany();
    return tasks;
  }

  async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const { title, description } = createTaskDto;

    const task = this.create({
      title,
      description,
      status: TaskStatus.OPEN,
      user,
    });

    await this.save(task);

    return task;
  }

  async deleteTaskById(id: string, user: User): Promise<void> {
    const result = await this.delete({ id, user });

    if (result.affected === 0)
      throw new NotFoundException(`Task with ID "${id}" not found!`);
  }

  async getTaskById(id: string, user: User): Promise<Task> {
    const found = await this.findOne({ where: { id, user } });

    if (!found) throw new NotFoundException(`Task with id "${id}" not found!`);

    return found;
  }
}
