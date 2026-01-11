import {forwardRef, Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {CompetitionsService} from './competitions.service';
import {CompetitionsController} from './competitions.controller';
import {Competition} from './entities/competition.entity';
import {CompetitionParticipant} from './entities/competition-participant.entity';
import {User} from '../users/entities/user.entity';
import {Bet} from '../bets/entities/bet.entity';
import {BetsModule} from "../bets/bets.module";
import {RolesGuard} from "../auth/guards/roles.guard";

@Module({
    imports: [
        TypeOrmModule.forFeature([Competition, CompetitionParticipant, User, Bet]),
        forwardRef(() => BetsModule) // forwardRef для избежания циклической зависимости],
    ],
    controllers: [CompetitionsController],
    providers: [CompetitionsService, RolesGuard],
    exports: [CompetitionsService], // Экспортируем для использования в других модулях
})
export class CompetitionsModule {
}
