# Development

From the repository root:

```bash
cd packages/python
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev,test]"
```

Useful commands:

```bash
python -m pytest
python -m pytest --cov=olloweditor
python -m ruff check .
python -m ruff format --check .
python -m mypy src
```
