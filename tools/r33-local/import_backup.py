"""Import a trusted D1 SQL backup into a new local SQLite file; never connect remotely."""
import argparse
import hashlib
import pathlib
import sqlite3


def import_backup(source: pathlib.Path, target: pathlib.Path) -> dict:
    source = source.resolve()
    target = target.resolve()
    if not source.is_file():
        raise FileNotFoundError(source)
    if target.exists():
        raise FileExistsError(f'Refusing to overwrite {target}')
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_name(target.name + '.importing')
    if temporary.exists():
        raise FileExistsError(f'Existing incomplete import: {temporary}')
    connection = sqlite3.connect(temporary)
    try:
        # Executes the complete export, including its schema and transaction commands.
        # Reading SQL into memory needs sufficient RAM for the original 342 MB export.
        connection.executescript(source.read_text(encoding='utf-8-sig'))
        connection.commit()
        integrity = connection.execute('PRAGMA integrity_check').fetchone()[0]
        if integrity != 'ok':
            raise RuntimeError(f'SQLite integrity check: {integrity}')
        tables = {r[0] for r in connection.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        required = {'wiki_articles', 'wiki_sources', 'wiki_evidence_claims', 'wiki_evidence_links', 'r44_receipts'}
        if not required <= tables:
            raise RuntimeError(f'Missing tables: {sorted(required - tables)}')
        count = connection.execute('SELECT count(*) FROM wiki_articles').fetchone()[0]
        if count != 10133:
            raise RuntimeError(f'Expected the 10,133-entry backup; got {count}')
    finally:
        connection.close()
    # No partial database is silently accepted. Failed imports retain .importing for inspection.
    temporary.rename(target)
    with source.open('rb') as handle:
        sha256 = hashlib.file_digest(handle, 'sha256').hexdigest()
    target.with_suffix(target.suffix + '.source-sha256').write_text(sha256 + '\n')
    return {'database': str(target), 'entries': count, 'source_sha256': sha256}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--sql', type=pathlib.Path, required=True)
    parser.add_argument('--database', type=pathlib.Path, default=pathlib.Path('tools/r33-local/workspace/mls.sqlite'))
    args = parser.parse_args()
    print(import_backup(args.sql, args.database))
