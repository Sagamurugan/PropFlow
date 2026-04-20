from fastapi import FastAPI

app = FastAPI(title="PropFlow AI Engine")


@app.get("/health")
def health_check():
    return {"status": "ok"}
