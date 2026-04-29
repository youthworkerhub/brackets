from fastapi import APIRouter, HTTPException
from heliclockter import datetime_utc
from pydantic import Field
from starlette import status
from decimal import Decimal

from bracket.config import config
from bracket.database import database
from bracket.models.db.player import PlayerToInsert
from bracket.models.db.shared import BaseModelORM
from bracket.models.db.team import TeamInsertable
from bracket.models.db.tournament import TournamentStatus
from bracket.logic.ranking.statistics import START_ELO
from bracket.routes.models import SuccessResponse
from bracket.schema import players, players_x_teams, teams
from bracket.sql.tournaments import sql_get_tournament
from bracket.utils.id_types import TournamentId

router = APIRouter(prefix=config.api_prefix)


class RegistrationBody(BaseModelORM):
    name: str = Field(..., min_length=1, max_length=30)


@router.post("/tournaments/{tournament_id}/register", response_model=SuccessResponse)
async def register_for_tournament(
    tournament_id: TournamentId,
    body: RegistrationBody,
) -> SuccessResponse:
    """
    Public endpoint: allows anyone to register for a tournament by submitting their name.
    Registration is only allowed when `registration_enabled` is True on the tournament.
    Creates a player and a solo team (inactive until approved by the organiser).
    """
    tournament = await sql_get_tournament(tournament_id)

    if not tournament.registration_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registration is not open for this tournament",
        )

    if tournament.status is not TournamentStatus.OPEN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This tournament is not accepting new registrations",
        )

    # Insert the player (inactive until the organiser activates them)
    player_id = await database.execute(
        query=players.insert(),
        values=PlayerToInsert(
            name=body.name,
            active=False,
            created=datetime_utc.now(),
            tournament_id=tournament_id,
            elo_score=START_ELO,
            swiss_score=Decimal("0.0"),
        ).model_dump(),
    )

    # Create a solo team for this player (also inactive)
    team_id = await database.execute(
        query=teams.insert(),
        values=TeamInsertable(
            name=body.name,
            active=False,
            created=datetime_utc.now(),
            tournament_id=tournament_id,
        ).model_dump(),
    )

    # Link player to the team
    await database.execute(
        query=players_x_teams.insert(),
        values={"player_id": player_id, "team_id": team_id},
    )

    return SuccessResponse()
