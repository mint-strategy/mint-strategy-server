import logging
import logging.config
import pathlib

import appdirs
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware

from .downloader import download as do_download
from .session import session_factory

app = FastAPI()

# logging.config.dictConfig(log_config)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event('startup')
async def configure() -> None:
    logging.getLogger(__name__).warning('logging configured')


@app.post("/loan_book/download")
async def download(request: Request, response: Response):
    cookies = await request.json()
    target = session_factory(
        pathlib.Path(appdirs.user_data_dir("mint_strategy"))
    ).zipped

    await do_download(cookies, request.headers, target)
    logging.info(target)

    response.status_code = status.HTTP_202_ACCEPTED
