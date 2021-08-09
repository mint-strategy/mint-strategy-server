import pprint

import sanic
from sanic import Sanic
from sanic.models.handler_types import MiddlewareResponse
from sanic_cors import cross_origin, CORS

from mint_strategy_server import downloader

app = Sanic(name='default')
CORS(app)


@app.post('/download')
@cross_origin(app, methods=['POST'])
async def download(request: sanic.Request) -> sanic.HTTPResponse:
    pprint.pprint(request.headers)
    sessionId = str(request.body, 'UTF-8')
    pprint.pprint(sessionId)
    downloader.download(sessionId)
    return sanic.text('')


def add_cors_headers(request: sanic.request.Request, response: sanic.response.BaseHTTPResponse) -> MiddlewareResponse:
    if request.method != "OPTIONS":
        return _add_cors_headers(request, response)


def _add_cors_headers(request: sanic.request.Request, response) -> MiddlewareResponse:
    headers = {
        "Access-Control-Allow-Origin": request.headers.get('Origin'),
        "access-Control-Allow-Method": ['POST'],
    }
    response.headers.extend(headers)
    pprint.pprint(response.headers)
    return response


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
