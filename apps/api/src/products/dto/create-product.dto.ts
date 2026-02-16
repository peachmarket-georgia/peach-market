import { IsString, IsInt, IsNotEmpty, MaxLength, Min } from 'class-validator'

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  title!: string

  @IsString()
  @IsNotEmpty()
  description!: string

  @IsInt()
  @Min(0)
  price!: number

  @IsString()
  @IsNotEmpty()
  category!: string

  @IsString()
  @IsNotEmpty()
  location!: string
}
