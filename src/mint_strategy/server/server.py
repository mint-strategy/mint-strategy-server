import logging.config
import pathlib

import appdirs
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware

from .downloader import download as do_download
from .session import session_factory

log_config = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler'
        }
    },
    "loggers": {
        "mint_strategy": {"level": "DEBUG", "handlers": ["console"]},
    }
}

logging.config.dictConfig(log_config)
log = logging.getLogger(__name__)
log.info('logging configured')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get('/')
async def hello(request: Request, response: Response):
    response.status_code = status.HTTP_200_OK


@app.post("/loan_book/download")
async def download(request: Request, response: Response):
    cookies = await request.json()
    target = session_factory(pathlib.Path(appdirs.user_data_dir('mint_strategy'))).zipped

    await do_download(cookies, request.headers, target)
    log.info(target)

    response.status_code = status.HTTP_202_ACCEPTED
