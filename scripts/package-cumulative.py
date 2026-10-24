#!/usr/bin/env python3
"""Build and verify cumulative source ZIP from exact Git HEAD without network, npm or Docker."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import stat
import subprocess
import zipfile

EXCLUDED_PARTS = frozenset({'.git', 'node_modules', '.pnpm-store', '.next', '.wrangler',
                            '__pycache__', 'dist', 'build', 'coverage', '.turbo'})
EXCLUDED_PREFIXES = ('outputs/', 'work/', 'runtime/', 'database-volumes/')
EXCLUDED_FILENAMES = frozenset({'.env', '.env.local', '.env.production', '.env.development',
                                'id_rsa', 'id_ed25519'})
EXPECTED = ('START_HERE.md', 'AGENTS.md', 'package.json', 'pnpm-lock.yaml',
            'handoff/CURRENT_TASK_REGISTER.json', 'handoff/PRODUCTION_TEST_MATRIX.md',
            'portable/migrations/004_workspace_completion.sql',
            '.github/workflows/verify.yml', 'scripts/test-workspace-browser.mjs')


def run_git(repo: Path, *args: str) -> bytes:
    return subprocess.check_output(['git', '-C', str(repo), *args], stderr=subprocess.PIPE)


def tracked_paths(repo: Path) -> tuple[list[str], list[str]]:
    selected, excluded = [], []
    names = run_git(repo, 'ls-files', '-z').split(b'\0')
    for raw in names:
        if not raw:
            continue
        name = os.fsdecode(raw)
        parts = Path(name).parts
        if (name.startswith(EXCLUDED_PREFIXES) or set(parts) & EXCLUDED_PARTS
                or name.startswith('deliverables/') and name.endswith(('.zip', '.tar', '.tar.gz'))):
            excluded.append(name)
            continue
        if Path(name).name in EXCLUDED_FILENAMES or any(part.lower().endswith(('.pem', '.p12', '.pfx', '.key')) for part in parts):
            raise RuntimeError('Refusing tracked secret-like path: ' + name)
        path = repo / name
        st = path.lstat()
        if not stat.S_ISREG(st.st_mode):
            raise RuntimeError('Refusing non-regular tracked path: ' + name)
        if path.resolve().is_relative_to(repo.resolve()) is False:
            raise RuntimeError('Refusing path outside checkout: ' + name)
        selected.append(name)
    return sorted(selected), sorted(excluded)


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as src:
        while part := src.read(1024 * 1024):
            h.update(part)
    return h.hexdigest()


def package(repo: Path, destination: Path) -> dict:
    repo = repo.resolve()
    revision = run_git(repo, 'rev-parse', 'HEAD').decode().strip()
    if subprocess.run(['git', '-C', str(repo), 'diff', '--quiet', 'HEAD', '--'], check=False).returncode:
        raise RuntimeError('Tracked working tree differs from HEAD; refuse ambiguous source package')
    selected, excluded = tracked_paths(repo)
    missing = sorted(set(EXPECTED) - set(selected))
    if missing:
        raise RuntimeError('Missing expected complete source members: ' + ', '.join(missing))
    if not any(name.startswith('reference/') for name in selected):
        raise RuntimeError('Original reference assets are missing')
    destination.mkdir(parents=True, exist_ok=True)
    zip_path = destination / f'FutureRobotic_AI_Cumulative_{revision[:12]}.zip'
    if zip_path.resolve().is_relative_to(repo) and zip_path.relative_to(repo).as_posix() in selected:
        raise RuntimeError('Output archive cannot be an included tracked source member')
    files = []
    with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6, allowZip64=True) as output:
        for name in selected:
            path = repo / name
            digest = sha256_file(path)
            size = path.stat().st_size
            output.write(path, arcname=name)
            files.append({'path': name, 'bytes': size, 'sha256': digest})
    with zipfile.ZipFile(zip_path, 'r') as candidate:
        if candidate.testzip() is not None or candidate.namelist() != selected:
            raise RuntimeError('ZIP CRC or member list verification failed')
        for entry in files:
            with candidate.open(entry['path']) as src:
                digest = hashlib.sha256()
                while chunk := src.read(1024 * 1024):
                    digest.update(chunk)
                if digest.hexdigest() != entry['sha256']:
                    raise RuntimeError('ZIP extracted content does not match: ' + entry['path'])
    digest = sha256_file(zip_path)
    (destination / (zip_path.name + '.sha256')).write_text(f'{digest}  {zip_path.name}\n', encoding='utf-8')
    result = {'status': 'PASS', 'application_source_revision': revision, 'zip_filename': zip_path.name,
              'zip_bytes': zip_path.stat().st_size, 'zip_sha256': digest, 'file_count': len(files),
              'excluded_tracked_generated_or_prior_archives': excluded,
              'all_members_sha256_verified': True, 'zip_crc': 'PASS', 'members': files}
    (destination / 'PACKAGE_VERIFICATION.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k:v for k,v in result.items() if k not in ('members', 'excluded_tracked_generated_or_prior_archives')}, indent=2))
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo', type=Path, default=Path.cwd())
    parser.add_argument('--out', type=Path, default=Path('work/source-package'))
    args = parser.parse_args()
    package(args.repo, args.out)
