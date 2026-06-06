import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TrafficSourcesService } from './traffic-sources.service';
import { CreateTrafficSourceDto, UpdateTrafficSourceDto } from './dto/traffic-source.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Controller('api/traffic-sources')
@UseGuards(ApiKeyGuard)
export class TrafficSourcesController {
  constructor(private readonly trafficSources: TrafficSourcesService) {}

  @Get()
  findAll(@Query('all') all?: string) {
    return all === '1' ? this.trafficSources.findAllAdmin() : this.trafficSources.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trafficSources.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTrafficSourceDto) {
    return this.trafficSources.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTrafficSourceDto) {
    return this.trafficSources.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.trafficSources.remove(id);
  }
}
