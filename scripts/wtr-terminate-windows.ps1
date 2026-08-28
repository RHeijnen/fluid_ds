param([string] $TargetsJson)

function Invoke-VerifiedProcessTermination {
  param(
    [Parameter(Mandatory)] $Target,
    [scriptblock] $Acquire = { param($ProcessId) [System.Diagnostics.Process]::GetProcessById($ProcessId) },
    [scriptblock] $Signal = {
      param($BoundHandle)
      if (-not ('FluidOwnedProcess' -as [type])) {
        Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class FluidOwnedProcess {
  [DllImport("kernel32.dll", SetLastError = true)]
  public static extern bool TerminateProcess(IntPtr process, uint exitCode);
}
'@
      }
      if (-not [FluidOwnedProcess]::TerminateProcess($BoundHandle, 1)) {
        throw [System.ComponentModel.Win32Exception]::new([Runtime.InteropServices.Marshal]::GetLastWin32Error())
      }
    }
  )
  $candidate = $null
  try {
    if ($Target.pid -le 0 -or $Target.pid -eq $PID -or [string]$Target.birth -notmatch '^\d+$') {
      throw 'Invalid owned process identity'
    }
    $candidate = & $Acquire $Target.pid
    # Opening this handle precedes identity verification. PID reuse after this
    # point cannot redirect the signal to another process object.
    $boundHandle = $candidate.Handle
    $nativeTicks = $candidate.StartTime.ToUniversalTime().Ticks
    # Win32_Process CreationDate serializes microseconds, not native 100ns ticks.
    $cimTicks = $nativeTicks - ($nativeTicks % 10)
    if ($cimTicks.ToString() -ne [string]$Target.birth) {
      return @{pid=$Target.pid;birth=$Target.birth;terminationRequested=$false;reason='identity-mismatch'}
    }
    & $Signal $boundHandle
    return @{pid=$Target.pid;birth=$Target.birth;terminationRequested=$true}
  } catch {
    return @{pid=$Target.pid;birth=$Target.birth;terminationRequested=$false;error=$_.Exception.Message}
  } finally {
    if ($null -ne $candidate) { $candidate.Dispose() }
  }
}

if ($MyInvocation.InvocationName -ne '.') {
  $targets = @($TargetsJson | ConvertFrom-Json)
  $results = foreach ($target in $targets) { Invoke-VerifiedProcessTermination -Target $target }
  @($results) | ConvertTo-Json -Compress
}
