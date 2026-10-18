#!/usr/bin/env python3
"""Initialize a non-overwriting feature/design ledger. Python standard library only."""
import argparse
import json
from pathlib import Path
from urllib.parse import urlsplit

CHECKS = ('runtime', 'routes', 'workflows', 'responsive', 'accessibility', 'motion', 'network', 'visual-review')


def initialize(output, source_url):
    parsed = urlsplit(source_url)
    if parsed.scheme not in ('http', 'https') or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError('Use an HTTP(S) source URL without embedded credentials')
    root = Path(output).expanduser().resolve()
    ledger_dir = root / '.rebuild'
    if ledger_dir.exists():
        raise FileExistsError(f'Existing ledger preserved: {ledger_dir}')
    root.mkdir(parents=True, exist_ok=True)
    ledger_dir.mkdir()
    ledger = {
        'schema_version': 1,
        'source': {'url': source_url, 'rea_evidence_files': [], 'scope_notes': ''},
        'mock_authorized': False,
        'design': {'original_ui': True, 'status': 'not-run', 'evidence': []},
        'features': [],
        'checks': [{'id': name, 'status': 'not-run', 'evidence': []} for name in CHECKS],
    }
    (ledger_dir / 'features.json').write_text(json.dumps(ledger, indent=2) + '\n', encoding='utf-8')
    (ledger_dir / 'brief.md').write_text(
        f'# Rebuild brief\n\nSource: {source_url}\n\n'
        'Record the requested pages, tier, critical journeys, delivery mode and existing project constraints.\n'
        'Record source-access limits and any explicitly authorized mock integrations.\n'
        'Add every requested capability to features.json before calling the scope complete.\n', encoding='utf-8')
    (ledger_dir / 'design.md').write_text(
        '# Original design direction\n\n'
        'Record the audience, task, new composition/navigation, typography, palette and component system.\n'
        'Describe how the major screens differ from the reference and how responsive layouts prioritize content.\n'
        'Describe purposeful motion, reduced-motion behavior and screenshot review outcomes.\n', encoding='utf-8')
    return ledger_dir


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, help='Selected project directory; existing app files are preserved')
    parser.add_argument('--source-url', required=True)
    args = parser.parse_args()
    try:
        target = initialize(args.output, args.source_url)
    except (OSError, ValueError) as exc:
        parser.exit(2, f'{exc}\n')
    print(f'Created {target}; populate features and evidence before auditing.')


if __name__ == '__main__':
    main()
