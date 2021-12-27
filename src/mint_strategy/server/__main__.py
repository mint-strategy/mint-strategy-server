import pathlib

if __name__ == "__main__":
    import sys

    if len(sys.argv) == 2:
        from mint_strategy.telegraf.excel_zip_loader import load_zip

        load_zip(pathlib.Path(sys.argv[1]))
    else:
        from mint_strategy.server.server import app
        import uvicorn

        uvicorn.run(app)
