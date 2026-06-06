import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ConversionEventTypesService } from './conversion-event-types.service';
import { CreateConversionEventTypeDto, UpdateConversionEventTypeDto } from './dto/conversion-event-type.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Controller('api/conversion-event-types')
@UseGuards(ApiKeyGuard)
export class ConversionEventTypesController {
  constructor(private readonly service: ConversionEventTypesService) {}

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.service.findAll(includeInactive === 'true');
  }

  @Post()
  create(@Body() dto: CreateConversionEventTypeDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateConversionEventTypeDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
