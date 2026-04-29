"""add registration_enabled to tournaments

Revision ID: a1b2c3d4e5f6
Revises: fa53e635f410
Create Date: 2026-04-29 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str | None = "a1b2c3d4e5f6"
down_revision: str | None = "fa53e635f410"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.add_column(
        "tournaments",
        sa.Column(
            "registration_enabled",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
    )


def downgrade() -> None:
    op.drop_column("tournaments", "registration_enabled")
