import { IsEmail, IsString, MinLength, IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @IsEmail({}, { message: 'Некорректный email' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Пароль должен быть не менее 6 символов' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Имя обязательно' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Фамилия обязательна' })
  lastName: string;

  @IsEnum(UserRole, { message: 'Некорректная роль пользователя' })
  role: UserRole;
}
