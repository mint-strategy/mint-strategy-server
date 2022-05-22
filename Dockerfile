FROM --platform=$TARGETPLATFORM python:3.10.4-bullseye

#RUN apk add build-base gcc musl-dev libffi-dev

ADD . /app

RUN pip3 install -e /app

EXPOSE 8000

CMD ["uvicorn", "--host", "0.0.0.0", "mint_strategy.server.server:app"] 

