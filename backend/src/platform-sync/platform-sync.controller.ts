import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { PlatformSyncService } from './platform-sync.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import {
  CreateCampaignMappingDto,
  CreatePlatformConnectionDto,
  ImportCsvDto,
  ManualSpendDto,
} from './dto/platform-sync.dto';

@Controller('api/integrations')
@UseGuards(ApiKeyGuard)
export class PlatformSyncController {
  constructor(private readonly sync: PlatformSyncService) {}

  @Get('connections')
  listConnections() {
    return this.sync.listConnections();
  }

  @Post('connections')
  createConnection(@Body() dto: CreatePlatformConnectionDto) {
    return this.sync.createConnection(dto);
  }

  @Put('connections/:id')
  updateConnection(@Param('id') id: string, @Body() dto: Partial<CreatePlatformConnectionDto>) {
    return this.sync.updateConnection(id, dto);
  }

  @Delete('connections/:id')
  deleteConnection(@Param('id') id: string) {
    return this.sync.deleteConnection(id);
  }

  @Post('connections/:id/test')
  testConnection(@Param('id') id: string) {
    return this.sync.testConnection(id);
  }

  @Post('sync')
  syncAll() {
    return this.sync.syncAll();
  }

  @Post('connections/:id/sync')
  syncOne(@Param('id') id: string) {
    return this.sync.syncConnection(id);
  }

  @Get('mappings')
  listMappings() {
    return this.sync.listMappings();
  }

  @Post('mappings')
  createMapping(@Body() dto: CreateCampaignMappingDto) {
    return this.sync.createMapping(dto);
  }

  @Delete('mappings/:id')
  deleteMapping(@Param('id') id: string) {
    return this.sync.deleteMapping(id);
  }

  @Post('spend/manual')
  manualSpend(@Body() dto: ManualSpendDto) {
    return this.sync.upsertManualSpend(dto);
  }

  @Post('spend/import-csv')
  importCsv(@Body() dto: ImportCsvDto) {
    return this.sync.importSpendCsv(dto.csv);
  }
}
