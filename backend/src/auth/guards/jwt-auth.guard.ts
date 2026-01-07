import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Guard для защиты роутов с помощью JWT
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
