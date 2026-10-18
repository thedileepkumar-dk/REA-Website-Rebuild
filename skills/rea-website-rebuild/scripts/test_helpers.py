#!/usr/bin/env python3
"""Behavioral checks for the ledger helpers; no network, browser or third-party packages."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from audit_rebuild import audit, REQUIRED_CHECKS
from init_rebuild import initialize


class HelperTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        initialize(self.root, 'https://example.com')
        self.ledger = self.root / '.rebuild' / 'features.json'
        # Text fixtures intentionally test existence only, not image/test authenticity.
        (self.root / 'evidence.txt').write_text('unit-test artifact fixture', encoding='utf-8')

    def write(self, data):
        self.ledger.write_text(json.dumps(data), encoding='utf-8')

    def complete(self):
        return {
            'schema_version': 1,
            'source': {'url': 'https://example.com', 'rea_evidence_files': ['evidence.txt']},
            'mock_authorized': False,
            'design': {'original_ui': True, 'status': 'pass', 'evidence': ['evidence.txt']},
            'features': [{'id': 'records', 'name': 'Manage records', 'required': True,
                          'source_status': 'observed', 'source_refs': ['ev_fixture'],
                          'acceptance': ['Create, reload and remove a record'],
                          'implementation': {'mode': 'local', 'status': 'complete', 'routes': ['/records']},
                          'tests': [{'name': 'Create/reload/remove', 'status': 'pass', 'evidence': ['evidence.txt']}]}],
            'checks': [{'id': k, 'status': 'pass', 'evidence': ['evidence.txt']} for k in REQUIRED_CHECKS],
        }

    def test_initialization_preserves_existing_files_and_refuses_overwrite(self):
        app = self.root / 'index.html'
        app.write_text('existing app', encoding='utf-8')
        before = self.ledger.read_bytes()
        with self.assertRaises(FileExistsError):
            initialize(self.root, 'https://other.example')
        self.assertEqual(before, self.ledger.read_bytes())
        self.assertEqual(app.read_text(), 'existing app')

    def test_invalid_url_does_not_create_output(self):
        target = self.root / 'bad-project'
        for url in ['file:///private/data', 'https://name:secret@example.com']:
            with self.assertRaises(ValueError):
                initialize(target, url)
        self.assertFalse(target.exists())

    def test_empty_inventory_fails(self):
        report = audit(self.root)
        self.assertFalse(report['recorded_scope_ready'])
        self.assertIn('No features inventoried; an empty scope cannot pass', report['errors'])

    def test_recorded_local_scope_can_pass(self):
        self.write(self.complete())
        self.assertTrue(audit(self.root)['recorded_scope_ready'])
        self.assertTrue(audit(self.root, 'production')['recorded_scope_ready'])

    def test_mock_requires_authorization_and_visible_label_and_fails_production(self):
        data = self.complete()
        data['features'][0]['implementation']['mode'] = 'mock'
        self.write(data)
        self.assertFalse(audit(self.root)['recorded_scope_ready'])
        data['mock_authorized'] = True
        self.write(data)
        self.assertFalse(audit(self.root)['recorded_scope_ready'])
        data['features'][0]['implementation']['mock_label'] = 'Simulated connection'
        self.write(data)
        self.assertTrue(audit(self.root)['recorded_scope_ready'])
        self.assertFalse(audit(self.root, 'production')['recorded_scope_ready'])

    def test_not_run_failed_and_blocked_are_not_pass(self):
        for change in ['test-not-run', 'check-fail', 'blocked', 'unimplemented']:
            data = self.complete()
            if change == 'test-not-run':
                data['features'][0]['tests'][0]['status'] = 'not-run'
            elif change == 'check-fail':
                data['checks'][0]['status'] = 'fail'
            elif change == 'blocked':
                data['features'][0]['implementation']['status'] = 'blocked'
            else:
                data['features'][0]['implementation']['mode'] = 'unimplemented'
            self.write(data)
            self.assertFalse(audit(self.root)['recorded_scope_ready'], change)

    def test_missing_and_outside_evidence_rejected(self):
        for reference in ['missing.png', '../outside.txt', str(self.root / 'evidence.txt')]:
            data = self.complete()
            data['design']['evidence'] = [reference]
            self.write(data)
            self.assertFalse(audit(self.root)['recorded_scope_ready'])

    def test_unknown_source_stays_explicit(self):
        data = self.complete()
        data['features'][0]['source_status'] = 'unavailable'
        data['features'][0]['source_notes'] = 'User approved independent local behavior from a public claim.'
        self.write(data)
        report = audit(self.root)
        self.assertTrue(report['recorded_scope_ready'])
        self.assertTrue(report['has_source_limits'])
        self.assertTrue(report['warnings'])

    def test_duplicate_ids_and_missing_checks_rejected(self):
        data = self.complete()
        data['features'].append(copy.deepcopy(data['features'][0]))
        data['checks'].pop()
        self.write(data)
        report = audit(self.root)
        self.assertFalse(report['recorded_scope_ready'])
        self.assertTrue(any('duplicate feature' in e for e in report['errors']))
        self.assertTrue(any('Missing required check' in e for e in report['errors']))

    def test_extra_build_failure_is_not_ignored(self):
        data = self.complete()
        data['checks'].append({'id': 'build', 'status': 'fail', 'evidence': ['evidence.txt']})
        self.write(data)
        self.assertFalse(audit(self.root)['recorded_scope_ready'])
        data['checks'][-1] = {'id': 'build', 'status': 'not-applicable', 'notes': 'Buildless HTML application'}
        self.write(data)
        self.assertTrue(audit(self.root)['recorded_scope_ready'])

    def test_optional_mock_cannot_bypass_authorization(self):
        data = self.complete()
        data['features'][0]['required'] = False
        data['features'][0]['implementation']['mode'] = 'mock'
        self.write(data)
        self.assertFalse(audit(self.root)['recorded_scope_ready'])

    def test_originality_review_required(self):
        data = self.complete()
        data['design']['original_ui'] = False
        self.write(data)
        self.assertFalse(audit(self.root)['recorded_scope_ready'])


if __name__ == '__main__':
    unittest.main()
