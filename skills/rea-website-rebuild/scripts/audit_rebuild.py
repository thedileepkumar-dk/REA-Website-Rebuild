#!/usr/bin/env python3
"""Audit declared coverage and artifact presence; does not execute or authenticate tests."""
import argparse
import json
from pathlib import Path
from urllib.parse import urlsplit

REQUIRED_CHECKS = {'runtime', 'routes', 'workflows', 'responsive', 'accessibility', 'motion', 'network', 'visual-review'}
MODES = {'real', 'local', 'mock', 'unimplemented'}
SOURCE_STATES = {'observed', 'claimed', 'inferred', 'unavailable'}


def audit(project, profile='demo'):
    root = Path(project).expanduser().resolve()
    data = json.loads((root / '.rebuild' / 'features.json').read_text(encoding='utf-8'))
    if not isinstance(data, dict):
        raise ValueError('Ledger must be a JSON object')
    if profile not in ('demo', 'production'):
        raise ValueError('Unknown profile')
    errors, warnings = [], []
    counts = dict.fromkeys(sorted(MODES), 0)

    def require(condition, message):
        if not condition:
            errors.append(message)

    def artifacts(items, label):
        if not isinstance(items, list) or not items:
            errors.append(f'{label}: missing evidence files')
            return
        for item in items:
            if not isinstance(item, str) or not item.strip():
                errors.append(f'{label}: evidence paths must be nonempty strings')
                continue
            relative = Path(item)
            candidate = (root / relative).resolve()
            if relative.is_absolute() or not candidate.is_relative_to(root) or not candidate.is_file():
                errors.append(f'{label}: missing or outside-project evidence: {item}')

    require(type(data.get('schema_version')) is int and data.get('schema_version') == 1, 'schema_version must be 1')
    source = data.get('source', {})
    if not isinstance(source, dict):
        raise ValueError('source must be an object')
    url = urlsplit(str(source.get('url', '')))
    require(url.scheme in ('http', 'https') and bool(url.hostname) and not url.username and not url.password,
            'source.url must be HTTP(S) without embedded credentials')
    artifacts(source.get('rea_evidence_files'), 'REA source observations')
    require(type(data.get('mock_authorized')) is bool, 'mock_authorized must be true or false')
    design = data.get('design', {})
    if not isinstance(design, dict):
        raise ValueError('design must be an object')
    require(design.get('original_ui') is True, 'Original interface is required')
    require(design.get('status') == 'pass', 'Original design visual review has not passed')
    artifacts(design.get('evidence'), 'Original design review')

    features = data.get('features')
    if not isinstance(features, list):
        raise ValueError('features must be an array')
    require(bool(features), 'No features inventoried; an empty scope cannot pass')
    ids = set()
    for index, feature in enumerate(features):
        if not isinstance(feature, dict):
            errors.append(f'Feature {index}: must be an object')
            continue
        fid = feature.get('id')
        label = fid if isinstance(fid, str) and fid else f'feature[{index}]'
        require(isinstance(fid, str) and bool(fid.strip()) and fid not in ids, f'{label}: missing or duplicate feature id')
        if isinstance(fid, str):
            ids.add(fid)
        require(bool(feature.get('name')), f'{label}: missing name')
        required = feature.get('required', True)
        require(type(required) is bool, f'{label}: required must be true or false')
        impl = feature.get('implementation', {})
        if not isinstance(impl, dict):
            errors.append(f'{label}: implementation must be an object')
            continue
        mode = impl.get('mode')
        require(mode in MODES, f'{label}: invalid implementation mode')
        if mode in MODES:
            counts[mode] += 1
        if mode == 'mock':
            require(data.get('mock_authorized') is True, f'{label}: mock integration is not authorized')
            require(bool(impl.get('mock_label')), f'{label}: visible mock label required')
            require(profile != 'production', f'{label}: production profile does not accept mocks')
        if not required:
            if mode == 'unimplemented' or impl.get('status') != 'complete':
                warnings.append(f'{label}: optional feature incomplete')
            continue
        source_state = feature.get('source_status')
        require(source_state in SOURCE_STATES, f'{label}: invalid source_status')
        refs = feature.get('source_refs')
        if source_state in ('observed', 'claimed'):
            require(isinstance(refs, list) and bool(refs) and all(isinstance(x, str) and x.strip() for x in refs),
                    f'{label}: source references required for observed/claimed feature')
        if source_state != 'observed':
            require(bool(feature.get('source_notes')), f'{label}: explain unobserved source behavior')
            warnings.append(f'{label}: source behavior {source_state}; parity is not fully observed')
        require(impl.get('status') == 'complete' and mode != 'unimplemented', f'{label}: implementation incomplete')
        routes = impl.get('routes')
        require(isinstance(routes, list) and bool(routes) and all(isinstance(x, str) and x.strip() for x in routes),
                f'{label}: implementation routes required')
        require(bool(feature.get('acceptance')), f'{label}: observable acceptance criteria required')
        tests = feature.get('tests')
        require(isinstance(tests, list) and bool(tests), f'{label}: missing workflow tests')
        for test in tests if isinstance(tests, list) else []:
            if not isinstance(test, dict):
                errors.append(f'{label}: test must be an object')
                continue
            require(bool(test.get('name')), f'{label}: test name required')
            require(test.get('status') == 'pass', f'{label}: workflow test not passed: {test.get("name", "unnamed")}')
            artifacts(test.get('evidence'), f'{label} test {test.get("name", "unnamed")}')

    checks = data.get('checks')
    if not isinstance(checks, list):
        raise ValueError('checks must be an array')
    seen_checks = set()
    for check in checks:
        if not isinstance(check, dict):
            errors.append('Check must be an object')
            continue
        cid = check.get('id')
        require(isinstance(cid, str) and cid and cid not in seen_checks, 'Check has missing or duplicate id')
        if isinstance(cid, str):
            seen_checks.add(cid)
        if cid not in REQUIRED_CHECKS and check.get('status') == 'not-applicable':
            require(bool(check.get('notes')), f'Check {cid}: explain why not applicable')
        else:
            require(check.get('status') == 'pass', f'Check not passed: {cid}')
            artifacts(check.get('evidence'), f'Check {cid}')
    for cid in sorted(REQUIRED_CHECKS - seen_checks):
        errors.append(f'Missing required check: {cid}')
    return {'recorded_scope_ready': not errors, 'profile': profile, 'features': len(features),
            'implementation_counts': counts, 'has_source_limits': bool(warnings),
            'errors': errors, 'warnings': warnings,
            'limit': 'Self-reported coverage and artifact existence only; not proof of test execution, visual quality, source parity or production readiness.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project', required=True)
    parser.add_argument('--profile', choices=['demo', 'production'], default='demo')
    args = parser.parse_args()
    try:
        report = audit(args.project, args.profile)
    except (OSError, ValueError, TypeError, KeyError) as exc:
        parser.exit(2, f'Invalid ledger: {exc}\n')
    print(json.dumps(report, indent=2))
    raise SystemExit(0 if report['recorded_scope_ready'] else 1)


if __name__ == '__main__':
    main()
