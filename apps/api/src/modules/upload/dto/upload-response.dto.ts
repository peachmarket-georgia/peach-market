import { ApiProperty } from '@nestjs/swagger';

export class UploadedImageDto {
  @ApiProperty({ description: '원본 이미지 URL' })
  url: string;

  @ApiProperty({ description: '썸네일 이미지 URL' })
  thumbnailUrl: string;

  @ApiProperty({ description: '원본 파일명' })
  originalName: string;

  @ApiProperty({ description: '파일 크기 (bytes)' })
  size: number;
}

export class UploadResponseDto {
  @ApiProperty({ description: '업로드된 이미지 목록', type: [UploadedImageDto] })
  images: UploadedImageDto[];
}
