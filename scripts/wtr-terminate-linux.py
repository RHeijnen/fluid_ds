"""Signal only a pidfd bound before native start-time verification. No third-party dependencies."""

import json
import os
import signal
import sys


def start_ticks(stat):
    closing = stat.rfind(")")
    fields = stat[closing + 1 :].split()
    if closing < 0 or len(fields) < 20 or not fields[19].isdigit():
        raise ValueError("Invalid Linux process stat")
    return fields[19]


class NativePidfd:
    def __init__(self):
        if not hasattr(os, "pidfd_open") or not hasattr(signal, "pidfd_send_signal"):
            raise RuntimeError("Stable pidfd cleanup is unavailable; numeric PID fallback is forbidden")

    def open(self, pid):
        return os.pidfd_open(pid, 0)

    def birth(self, pid):
        with open(f"/proc/{pid}/stat", encoding="utf8") as stat:
            return start_ticks(stat.read())

    def send(self, handle):
        signal.pidfd_send_signal(handle, signal.SIGKILL, None, 0)

    def close(self, handle):
        os.close(handle)


def terminate_target(target, api):
    result = {"pid": target.get("pid"), "birth": target.get("birth"), "terminationRequested": False}
    handle = None
    try:
        pid = target["pid"]
        birth = target["birth"]
        if type(pid) is not int or pid <= 0 or pid in (os.getpid(), os.getppid()) or not isinstance(birth, str) or not birth.isdigit():
            raise ValueError("Invalid owned process identity")
        handle = api.open(pid)
        if api.birth(pid) != birth:
            result["reason"] = "identity-mismatch"
            return result
        api.send(handle)
        result["terminationRequested"] = True
    except Exception as error:
        result["error"] = str(error)
    finally:
        if handle is not None:
            api.close(handle)
    return result


if __name__ == "__main__":
    # Missing Python/pidfd support fails the supervisor cleanup phase. It never
    # falls back to os.kill or reports successful cleanup without a stable handle.
    targets = json.loads(sys.argv[1])
    native = NativePidfd()
    print(json.dumps([terminate_target(target, native) for target in targets]))
