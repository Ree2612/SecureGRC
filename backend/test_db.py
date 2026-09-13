import asyncio; from app.main import lifespan; from fastapi import FastAPI; 
async def test():
    async with lifespan(FastAPI()):
        pass
asyncio.run(test())
