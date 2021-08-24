import logging.config

import aiohttp
import mint_strategy.loan_book as lb
import sanic
import sanic.log
import sanic_cors

import mint_strategy.server.session as s

log_config = sanic.log.LOGGING_CONFIG_DEFAULTS
log_config['loggers'].update({
    "mint_strategy": {
        "level": "DEBUG",
        "handlers": ["console"]
    },
})

logging.config.dictConfig(log_config)

log = logging.getLogger('mint-strategy.server')

app = sanic.Sanic('default', configure_logging=False)
sanic_cors.CORS(app)


@app.post('/download')
@sanic_cors.cross_origin(app, methods=['POST'])
async def download(request: sanic.Request) -> sanic.HTTPResponse:
    await app.ctx.downloader.download(request.json, request.headers)
    return sanic.response.empty()


@app.listener("before_server_start")
async def setup_downloader(app, _) -> None:
    client_session = aiohttp.ClientSession()
    app.ctx.client_session = client_session
    app.ctx.downloader = lb.Downloader(
        client_session,
        s.session_factory
    )
    log.debug('Client Session ready')


@app.listener("after_server_stop")
async def teardown_client(app, _) -> None:
    await app.ctx.client_session.close()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
