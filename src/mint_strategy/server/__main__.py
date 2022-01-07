import pathlib

log_config = {
    "version": 1,
    "disable_existing_loggers": True,
    "formatters": {
        "default": {
            "()": "uvicorn.logging.DefaultFormatter",
            "fmt": "%(levelprefix)s %(message)s",
            "use_colors": False,
        },
        "access": {
            "()": "uvicorn.logging.AccessFormatter",
            "fmt": '%(levelprefix)s %(client_addr)s - "%(request_line)s" %(status_code)s',  # noqa: E501
            "use_colors": False,
        },
    },
    "handlers": {
        "default": {
            "formatter": "default",
            "class": "logging.FileHandler",
            "filename": "default.log",
        },
        "access": {
            "formatter": "access",
            "class": "logging.FileHandler",
            "filename": "access.log",
        },
    },
    "loggers": {
        "uvicorn": {"level": "INFO"},
        "uvicorn.error": {"level": "INFO",},
        "uvicorn.access": {"handlers": ["access"], "level": "INFO", "propagate": False},
    },
    "root": {"handlers": ["default"], "level": "DEBUG"},
}


def main():
    import sys
    import logging

    if len(sys.argv) == 2:
        from mint_strategy.telegraf.excel_zip_loader import load_zip
        import logging.config

        logging.config.dictConfig(log_config)

        load_zip(pathlib.Path(sys.argv[1]))
    else:
        from mint_strategy.server.server import app
        import uvicorn

        uvicorn.run(app, log_config=log_config)


if __name__ == "__main__":
    main()
