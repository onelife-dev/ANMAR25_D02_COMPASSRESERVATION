import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { Status } from 'generated/prisma';

@Injectable()
export class SpaceService {
  constructor(private prisma: PrismaService) {}

  async create(createSpaceDto: CreateSpaceDto) {
    const existingSpace = await this.prisma.space.findUnique({
      where: { name: createSpaceDto.name },
    });
    if (existingSpace) {
      throw new Error('Space name must be unique');
    }

    return this.prisma.space.create({
      data: {
        name: createSpaceDto.name,
        description: createSpaceDto.description,
        capacity: createSpaceDto.capacity,
      },
    });
  }

  async findAll(query: PaginationDto & { name?: string; capacity?: number; status?: Status }) {
    const { name, capacity, status } = query;

    const filter: any = {};

    if (name) filter.name = { contains: name, mode: 'insensitive' };
    if (capacity) filter.capacity = { gte: +capacity };
    if (status) filter.status = status;

    return PaginationService.paginate(
      () => this.prisma.space.findMany({
        where: filter,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      () => this.prisma.space.count({ where: filter }),
      query,
    );
  }

  async findOne(id: string) {
    const space = await this.prisma.space.findUnique({
      where: { id: +id },
    });

    if (!space) {
      throw new NotFoundException(`Space with ID ${id} not found`);
    }

    return space;
  }

  async update(id: string, updateSpaceDto: UpdateSpaceDto) {
    const space = await this.prisma.space.findUnique({
      where: { id: +id },
    });

    if (!space) {
      throw new NotFoundException(`Space with ID ${id} not found`);
    }

    return this.prisma.space.update({
      where: { id: +id },
      data: {
        ...updateSpaceDto,
        updatedAt: new Date(),
      },
    });
  }

  async remove(id: string) {
    const space = await this.prisma.space.findUnique({
      where: { id: +id },
    });

    if (!space) {
      throw new NotFoundException(`Space with ID ${id} not found`);
    }

    return this.prisma.space.update({
      where: { id: +id },
      data: {
        status: Status.inactive,
        updatedAt: new Date(),
      },
    });
  }
}
