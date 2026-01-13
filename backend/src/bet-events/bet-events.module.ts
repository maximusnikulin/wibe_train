import {forwardRef, Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {BetEventsService} from './bet-events.service';
import {BetEventsController} from './bet-events.controller';
import {BetEvent} from './entities/bet-event.entity';
import {BetEventParticipant} from './entities/bet-event-participant.entity';
import {User} from '../users/entities/user.entity';
import {Bet} from '../bets/entities/bet.entity';
import {BetsModule} from "../bets/bets.module";
import {RolesGuard} from "../auth/guards/roles.guard";

@Module({
    imports: [
        TypeOrmModule.forFeature([BetEvent, BetEventParticipant, User, Bet]),
        forwardRef(() => BetsModule) // forwardRef для избежания циклической зависимости],
    ],
    controllers: [BetEventsController],
    providers: [BetEventsService, RolesGuard],
    exports: [BetEventsService], // Экспортируем для использования в других модулях
})
export class BetEventsModule {
}
