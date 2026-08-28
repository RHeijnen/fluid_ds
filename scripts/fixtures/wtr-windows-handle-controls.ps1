$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '../wtr-terminate-windows.ps1')

function Assert-Equal($Actual, $Expected) {
  if ($Actual -ne $Expected) { throw "Expected '$Expected', got '$Actual'" }
}

foreach ($mode in @('matched', 'reused-pid', 'signal-failure', 'acquire-failure')) {
  $script:trace = [System.Collections.Generic.List[string]]::new()
  $script:mode = $mode
  $acquire = {
    param($ProcessId)
    $script:trace.Add('acquire')
    if ($script:mode -eq 'acquire-failure') { throw 'Injected acquire failure' }
    $candidate = [pscustomobject]@{}
    $candidate | Add-Member -MemberType ScriptProperty -Name Handle -Value {
      $script:trace.Add('handle')
      return [IntPtr]1234
    }
    $candidate | Add-Member -MemberType ScriptProperty -Name StartTime -Value {
      $script:trace.Add('birth')
      $ticks = if ($script:mode -eq 'reused-pid') { 639233508070697606L } else { 639233508070697596L }
      return [DateTime]::new($ticks, [DateTimeKind]::Utc)
    }
    $candidate | Add-Member -MemberType ScriptMethod -Name Dispose -Value { $script:trace.Add('dispose') }
    return $candidate
  }
  $signal = {
    param($BoundHandle)
    Assert-Equal $BoundHandle.ToInt64() 1234
    $script:trace.Add('signal-bound-handle')
    if ($script:mode -eq 'signal-failure') { throw 'Injected signal failure' }
  }
  # Both native operations are replaced by local mocks. This script never opens
  # a process handle, invokes TerminateProcess, or kills a live process.
  $result = Invoke-VerifiedProcessTermination -Target @{pid=42;birth='639233508070697590'} -Acquire $acquire -Signal $signal
  switch ($mode) {
    'matched' {
      Assert-Equal $result.terminationRequested $true
      Assert-Equal ($script:trace -join ',') 'acquire,handle,birth,signal-bound-handle,dispose'
    }
    'reused-pid' {
      Assert-Equal $result.terminationRequested $false
      Assert-Equal $result.reason 'identity-mismatch'
      Assert-Equal ($script:trace -join ',') 'acquire,handle,birth,dispose'
    }
    'signal-failure' {
      Assert-Equal $result.terminationRequested $false
      Assert-Equal ($script:trace -join ',') 'acquire,handle,birth,signal-bound-handle,dispose'
    }
    'acquire-failure' {
      Assert-Equal $result.terminationRequested $false
      Assert-Equal ($script:trace -join ',') 'acquire'
    }
  }
  Write-Output "PASS mocked Windows handle control: $mode"
}
