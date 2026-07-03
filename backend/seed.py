import asyncio
import bcrypt
from sqlalchemy import select

from src.database import async_session_factory
from src.models import User, Workspace, WorkspaceMember, Bot


async def seed():
    async with async_session_factory() as db:
        existing = await db.execute(select(User).where(User.email == "demo@arabbot.com"))
        if existing.scalar_one_or_none():
            print("Demo user already exists")
            return

        user = User(
            email="demo@arabbot.com",
            password_hash=bcrypt.hashpw("demo1234".encode(), bcrypt.gensalt()).decode(),
            phone="+201000000000",
        )
        db.add(user)
        await db.flush()

        workspace = Workspace(name="Demo Workshop")
        db.add(workspace)
        await db.flush()

        membership = WorkspaceMember(workspace_id=workspace.id, user_id=user.id, role="owner")
        db.add(membership)

        bot = Bot(
            name="Demo Assistant",
            channel="whatsapp",
            workspace_id=workspace.id,
            human_handoff_enabled=True,
        )
        db.add(bot)

        await db.commit()
        print(f"Created: demo@arabbot.com / demo1234  |  Bot: {bot.id}")


if __name__ == "__main__":
    asyncio.run(seed())
