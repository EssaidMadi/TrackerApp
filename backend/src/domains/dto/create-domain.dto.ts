import { IsString, Matches, IsOptional } from 'class-validator';

export class CreateDomainDto {
  @IsString()
  label: string;

  @IsString()
  @Matches(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i, {
    message: 'rootDomain must be a valid domain (e.g. auto-coverage.co)',
  })
  rootDomain: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i, {
    message: 'subdomain must be alphanumeric (e.g. track)',
  })
  subdomain?: string;
}
