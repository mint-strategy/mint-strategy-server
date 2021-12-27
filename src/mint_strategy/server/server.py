import logging
import logging.config
import pathlib

import appdirs
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware

from .downloader import download as do_download
from .session import session_factory

log_config = {
    'version': 1,
    'disable_existing_loggers': True,
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
logging.info('logging configured')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/loan_book/download")
async def download(request: Request, response: Response):
    cookies = await request.json()
    target = session_factory(pathlib.Path(appdirs.user_data_dir('mint_strategy'))).zipped

    await do_download(cookies, request.headers, target)
    logging.info(target)

    response.status_code = status.HTTP_202_ACCEPTED
