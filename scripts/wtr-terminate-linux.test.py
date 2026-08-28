"""Mock-only pidfd controls. No process is opened or signaled by these tests."""

import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("owned_pidfd", Path(__file__).with_name("wtr-terminate-linux.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class FakePidfd:
    def __init__(self, birth="123", fail=None):
        self.expected_birth = birth
        self.fail = fail
        self.trace = []

    def open(self, pid):
        self.trace.append(("open", pid))
        if self.fail == "open":
            raise ProcessLookupError("Process exited before opening")
        return 999

    def birth(self, pid):
        self.trace.append(("birth", pid))
        if self.fail == "birth":
            raise ProcessLookupError("Process exited after opening")
        return self.expected_birth

    def send(self, handle):
        self.trace.append(("send", handle))
        if self.fail == "send":
            raise ProcessLookupError("Bound process exited after verification")

    def close(self, handle):
        self.trace.append(("close", handle))


class StableHandleControls(unittest.TestCase):
    def test_signal_uses_handle_opened_before_identity_check(self):
        fake = FakePidfd()
        result = module.terminate_target({"pid": 42, "birth": "123"}, fake)
        self.assertTrue(result["terminationRequested"])
        self.assertEqual(fake.trace, [("open", 42), ("birth", 42), ("send", 999), ("close", 999)])

    def test_pid_reuse_never_signals_replacement(self):
        fake = FakePidfd(birth="124")
        result = module.terminate_target({"pid": 42, "birth": "123"}, fake)
        self.assertFalse(result["terminationRequested"])
        self.assertEqual(result["reason"], "identity-mismatch")
        self.assertEqual(fake.trace, [("open", 42), ("birth", 42), ("close", 999)])

    def test_failure_paths_close_bound_handle_without_numeric_pid_fallback(self):
        for phase in ("open", "birth", "send"):
            with self.subTest(phase=phase):
                fake = FakePidfd(fail=phase)
                result = module.terminate_target({"pid": 42, "birth": "123"}, fake)
                self.assertFalse(result["terminationRequested"])
                self.assertIn("error", result)
                if phase == "open":
                    self.assertEqual(fake.trace, [("open", 42)])
                else:
                    self.assertEqual(fake.trace[-1], ("close", 999))

    def test_parenthesized_process_names_preserve_start_ticks(self):
        fields = ["S", "10", *(["0"] * 17), "1234567890123456789"]
        self.assertEqual(module.start_ticks("20 (name (nested)) " + " ".join(fields)), "1234567890123456789")
        with self.assertRaises(ValueError):
            module.start_ticks("20 (bad) S 10")


if __name__ == "__main__":
    unittest.main()
