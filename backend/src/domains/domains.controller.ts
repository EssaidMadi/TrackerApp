import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { DomainsService } from './domains.service';
import { CreateDomainDto } from './dto/create-domain.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Controller('api/domains')
@UseGuards(ApiKeyGuard)
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Post()
  create(@Body() dto: CreateDomainDto) {
    return this.domainsService.create(dto);
  }

  @Get()
  findAll() {
    return this.domainsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.domainsService.findOne(id);
  }

  @Post(':id/refresh-dns')
  refreshDns(@Param('id') id: string) {
    return this.domainsService.refreshDnsRecords(id);
  }

  @Post(':id/verify')
  verify(@Param('id') id: string) {
    return this.domainsService.verify(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.domainsService.remove(id);
  }
}
