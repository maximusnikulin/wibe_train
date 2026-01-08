import { IsEmail, IsString, MinLength, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email пользователя'
  })
  @IsEmail({}, { message: 'Некорректный email' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Пароль (минимум 6 символов)',
    minLength: 6
  })
  @IsString()
  @MinLength(6, { message: 'Пароль должен быть не менее 6 символов' })
  password: string;

  @ApiProperty({
    example: 'Иван',
    description: 'Имя пользователя'
  })
  @IsString()
  @IsNotEmpty({ message: 'Имя обязательно' })
  firstName: string;

  @ApiProperty({
    example: 'Иванов',
    description: 'Фамилия пользователя'
  })
  @IsString()
  @IsNotEmpty({ message: 'Фамилия обязательна' })
  lastName: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.FAN,
    description: 'Роль пользователя: fan (болельщик) или participant (участник)'
  })
  @IsEnum(UserRole, { message: 'Некорректная роль пользователя' })
  role: UserRole;
}
