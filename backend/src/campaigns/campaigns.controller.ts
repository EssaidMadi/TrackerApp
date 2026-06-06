import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  UpdatePostbackConfigDto,
} from './dto/create-campaign.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Controller('api')
@UseGuards(ApiKeyGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post('campaigns')
  create(@Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(dto);
  }

  @Get('campaigns')
  findAll() {
    return this.campaignsService.findAll();
  }

  @Get('campaigns/:id')
  findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  @Put('campaigns/:id')
  update(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaignsService.update(id, dto);
  }

  @Delete('campaigns/:id')
  remove(@Param('id') id: string) {
    return this.campaignsService.remove(id);
  }

  @Put('campaigns/:id/postback-config')
  updatePostbackConfig(
    @Param('id') id: string,
    @Body() dto: UpdatePostbackConfigDto,
  ) {
    return this.campaignsService.updatePostbackConfig(id, dto);
  }

  @Get('campaigns/:id/stats')
  getStats(@Param('id') id: string) {
    return this.campaignsService.getStats(id);
  }
}
