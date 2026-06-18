'====================================================================
' ASSEMBLY: HEARTBEAT DRUM KIOSK FRAME + PREMIUM CLADDING PANELS
' Target: SolidWorks 2026 (API 32.x)
'
' Assembles:
'   1. HeartbeatDrumKiosk_Frame.SLDPRT  (structural weldment frame)
'   2. KioskCladding.SLDPRT             (sheet-metal cladding for new frame)
'
' The frame is placed at the origin (fixed). The cladding is mated
' concentrically to the frame using Right/Front/Top plane coincident
' mates. Optional components (drum, bezel, platform) can be included.
'
' HOW TO RUN:
'   1. Open SolidWorks 2026
'   2. Run KioskNewCladding.bas first (creates KioskCladding.SLDPRT)
'   3. Run HeartbeatDrumKioskFrame.bas (creates the frame part)
'   4. Tools > Macro > Edit (VBA Editor)
'   5. File > Import File > select this .bas file
'   6. F5 > AssembleFrameAndCladding
'
' No type library references needed (late binding).
'====================================================================
Option Explicit

'--- Application References (late binding) ---
Dim g_swApp      As Object
Dim g_swModel    As Object
Dim g_swAssy     As Object
Dim g_swAssyDoc  As Object
Dim g_swSkMgr    As Object
Dim g_swFeatMgr  As Object
Dim g_swSelMgr   As Object

'--- Unit conversion (mm -> meters) ---
Const MM As Double = 0.001

'--- Project path ---
Const PROJ_PATH As String = "C:\Users\kisha\Documents\Kiosk\"

'--- Part filenames ---
Const FRAME_PART   As String = "HeartbeatDrumKiosk_Frame.SLDPRT"
Const CLAD_PART    As String = "KioskCladding.SLDPRT"
Const DRUM_PART    As String = "DrumModule.SLDPRT"
Const BEZEL_PART   As String = "DisplayBezel.SLDPRT"
Const PLATFORM_PART As String = "WeightPlatform.SLDPRT"

'--- Assembly output ---
Const ASSEMBLY_OUT As String = "HeartbeatDrumKiosk_Assembly.SLDASM"

'--- Include optional components? ---
Const INCLUDE_DRUM    As Boolean = True
Const INCLUDE_BEZEL   As Boolean = True
Const INCLUDE_PLATFORM As Boolean = True

'====================================================================
' MAIN ENTRY POINT
'====================================================================
Sub AssembleFrameAndCladding()
    '--- Connect to SolidWorks ---
    On Error Resume Next
    Set g_swApp = Application.SldWorks
    If g_swApp Is Nothing Then
        MsgBox "Cannot access SolidWorks 2026." & vbCrLf & _
               "Run this macro from within SolidWorks.", _
               vbCritical, "Connection Error"
        Exit Sub
    End If
    On Error GoTo 0

    Debug.Print "=== Assembling Frame + Premium Cladding ==="
    Debug.Print "API revision: " & g_swApp.RevisionNumber

    '--- Verify required parts exist ---
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")

    If Not fso.FileExists(PROJ_PATH & FRAME_PART) Then
        MsgBox "Missing structural frame:" & vbCrLf & _
               PROJ_PATH & FRAME_PART & vbCrLf & vbCrLf & _
               "Run HeartbeatDrumKioskFrame.bas first.", _
               vbCritical, "Frame Not Found"
        Exit Sub
    End If

    If Not fso.FileExists(PROJ_PATH & CLAD_PART) Then
        MsgBox "Missing cladding:" & vbCrLf & _
               PROJ_PATH & CLAD_PART & vbCrLf & vbCrLf & _
               "Run KioskNewCladding.bas first.", _
               vbCritical, "Cladding Not Found"
        Exit Sub
    End If

    '--- Check optional parts ---
    Dim hasDrum As Boolean, hasBezel As Boolean, hasPlatform As Boolean
    hasDrum = INCLUDE_DRUM And fso.FileExists(PROJ_PATH & DRUM_PART)
    hasBezel = INCLUDE_BEZEL And fso.FileExists(PROJ_PATH & BEZEL_PART)
    hasPlatform = INCLUDE_PLATFORM And fso.FileExists(PROJ_PATH & PLATFORM_PART)

    Debug.Print "  Frame:     " & FRAME_PART
    Debug.Print "  Cladding:  " & CLAD_PART
    Debug.Print "  Drum:      " & hasDrum
    Debug.Print "  Bezel:     " & hasBezel
    Debug.Print "  Platform:  " & hasPlatform

    '--- Close old assembly if open ---
    On Error Resume Next
    g_swApp.CloseDoc ASSEMBLY_OUT
    On Error GoTo 0

    '--- Create new assembly document ---
    Dim tmpl As String
    tmpl = ""
    On Error Resume Next
    tmpl = g_swApp.GetUserPreferenceStringValue(72)  ' swDefaultTemplateAssembly
    On Error GoTo 0

    If tmpl <> "" Then
        If Not fso.FileExists(tmpl) Then tmpl = ""
    End If

    ' Fallback to MBD template
    If tmpl = "" Then
        Dim mbdTmpl As String
        mbdTmpl = "C:\ProgramData\SolidWorks\SOLIDWORKS 2026\templates\MBD\assembly 0251mm to 1000mm.asmdot"
        If fso.FileExists(mbdTmpl) Then tmpl = mbdTmpl
    End If

    If tmpl = "" Then
        MsgBox "No assembly template found." & vbCrLf & _
               "Create an assembly manually, then re-run this macro.", _
               vbCritical, "Template Error"
        Exit Sub
    End If

    Dim swAssy As Object
    Set swAssy = g_swApp.NewDocument(tmpl, 0, 0, 0)
    If swAssy Is Nothing Then
        MsgBox "Failed to create assembly document.", vbCritical
        Exit Sub
    End If

    Set g_swAssy = swAssy
    Set g_swAssyDoc = swAssy
    Set g_swModel = swAssy
    Set g_swSkMgr = swAssy.SketchManager
    Set g_swFeatMgr = swAssy.FeatureManager
    Set g_swSelMgr = swAssy.SelectionManager

    '--- Get assembly title for mate selection ---
    Dim assyTitle As String
    assyTitle = swAssy.GetTitle
    If InStr(assyTitle, ".") > 0 Then
        assyTitle = Left(assyTitle, InStr(assyTitle, ".") - 1)
    End If
    Debug.Print "  Assembly: " & assyTitle

    Dim t0 As Double
    t0 = Timer

    '==============================================================
    ' ADD COMPONENTS
    '==============================================================

    '--- 1. STRUCTURAL FRAME (fixed at origin) ---
    Dim compFrame As Object
    Set compFrame = g_swAssyDoc.AddComponent5( _
        PROJ_PATH & FRAME_PART, 0, "", False, "", 0, 0, 0)
    If compFrame Is Nothing Then
        Debug.Print "  ERR: Could not add frame"
        MsgBox "Failed to add frame component.", vbCritical
        Exit Sub
    End If
    On Error Resume Next
    compFrame.Fixed = True
    On Error GoTo 0
    Debug.Print "  Frame added (fixed): " & compFrame.Name2
    RebuildSw

    '--- 2. PREMIUM CLADDING (concentric with frame) ---
    Dim compClad As Object
    Set compClad = g_swAssyDoc.AddComponent5( _
        PROJ_PATH & CLAD_PART, 0, "", False, "", 0, 0, 0)
    If compClad Is Nothing Then
        Debug.Print "  ERR: Could not add cladding"
        MsgBox "Failed to add cladding component.", vbCritical
        Exit Sub
    End If
    Debug.Print "  Cladding added: " & compClad.Name2
    RebuildSw

    '--- 3. DRUM MODULE (optional, at neck top) ---
    Dim compDrum As Object
    If hasDrum Then
        Set compDrum = g_swAssyDoc.AddComponent5( _
            PROJ_PATH & DRUM_PART, 0, "", False, "", _
            0, m(1660), 0)  ' approximate neck top height
        If Not compDrum Is Nothing Then
            Debug.Print "  Drum added: " & compDrum.Name2
        Else
            Debug.Print "  WARN: Could not add drum"
        End If
        RebuildSw
    End If

    '--- 4. DISPLAY BEZEL (optional, at screen height) ---
    Dim compBezel As Object
    If hasBezel Then
        Set compBezel = g_swAssyDoc.AddComponent5( _
            PROJ_PATH & BEZEL_PART, 0, "", False, "", _
            0, m(950), m(240))  ' approximate screen position
        If Not compBezel Is Nothing Then
            Debug.Print "  Bezel added: " & compBezel.Name2
        Else
            Debug.Print "  WARN: Could not add bezel"
        End If
        RebuildSw
    End If

    '--- 5. WEIGHT PLATFORM (optional, at floor level) ---
    Dim compPlatform As Object
    If hasPlatform Then
        Set compPlatform = g_swAssyDoc.AddComponent5( _
            PROJ_PATH & PLATFORM_PART, 0, "", False, "", _
            0, m(-100), m(500))  ' approximate podium position
        If Not compPlatform Is Nothing Then
            Debug.Print "  Platform added: " & compPlatform.Name2
        Else
            Debug.Print "  WARN: Could not add platform"
        End If
        RebuildSw
    End If

    '==============================================================
    ' CREATE MATES
    '==============================================================
    Debug.Print "  Creating mates..."
    Dim mateCount As Long
    mateCount = 0

    '--- MATE GROUP 1: Frame to Cladding (primary alignment) ---
    ' Align X center
    If MatePlanes(compFrame.Name2, "Right Plane", _
                  compClad.Name2, "Right Plane", assyTitle) Then
        mateCount = mateCount + 1
    End If
    ' Align Z center
    If MatePlanes(compFrame.Name2, "Front Plane", _
                  compClad.Name2, "Front Plane", assyTitle) Then
        mateCount = mateCount + 1
    End If
    ' Align Y (base level)
    If MatePlanes(compFrame.Name2, "Top Plane", _
                  compClad.Name2, "Top Plane", assyTitle) Then
        mateCount = mateCount + 1
    End If

    '--- MATE GROUP 2: Drum to Frame (if present) ---
    If Not compDrum Is Nothing Then
        ' Align X center
        If MatePlanes(compFrame.Name2, "Right Plane", _
                      compDrum.Name2, "Right Plane", assyTitle) Then
            mateCount = mateCount + 1
        End If
        ' Align Z center
        If MatePlanes(compFrame.Name2, "Front Plane", _
                      compDrum.Name2, "Front Plane", assyTitle) Then
            mateCount = mateCount + 1
        End If
    End If

    '--- MATE GROUP 3: Bezel to Cladding (if present) ---
    If Not compBezel Is Nothing Then
        ' Align X center with cladding
        If MatePlanes(compClad.Name2, "Right Plane", _
                      compBezel.Name2, "Right Plane", assyTitle) Then
            mateCount = mateCount + 1
        End If
        ' Align Y position
        If MatePlanes(compClad.Name2, "Top Plane", _
                      compBezel.Name2, "Top Plane", assyTitle) Then
            mateCount = mateCount + 1
        End If
    End If

    '--- MATE GROUP 4: Platform to Frame (if present) ---
    If Not compPlatform Is Nothing Then
        ' Align X center
        If MatePlanes(compFrame.Name2, "Right Plane", _
                      compPlatform.Name2, "Right Plane", assyTitle) Then
            mateCount = mateCount + 1
        End If
        ' Align Z center
        If MatePlanes(compFrame.Name2, "Front Plane", _
                      compPlatform.Name2, "Front Plane", assyTitle) Then
            mateCount = mateCount + 1
        End If
    End If

    Debug.Print "  Total mates: " & mateCount

    '==============================================================
    ' FINALIZE
    '==============================================================
    g_swAssy.ForceRebuild3 True
    On Error Resume Next
    g_swAssy.ViewZoomtofit
    On Error GoTo 0

    '--- Save assembly ---
    Dim saveErr As Long, saveWarn As Long
    g_swAssy.SaveAs4 PROJ_PATH & ASSEMBLY_OUT, 0, 0, saveErr, saveWarn
    If saveErr <> 0 Then
        Debug.Print "  Save warning: " & saveErr
    End If
    Debug.Print "  Saved: " & PROJ_PATH & ASSEMBLY_OUT

    Debug.Print "=== Assembly complete in " & Format(Timer - t0, "0.0") & "s ==="

    Dim msgParts As String
    msgParts = "1. Structural Frame (weldment)" & vbCrLf & _
               "2. Premium Cladding (sheet-metal)"
    If hasDrum Then msgParts = msgParts & vbCrLf & "3. Drum Module"
    If hasBezel Then msgParts = msgParts & vbCrLf & "4. Display Bezel"
    If hasPlatform Then msgParts = msgParts & vbCrLf & "5. Weight Platform / Podium"

    MsgBox "Assembly complete!" & vbCrLf & vbCrLf & _
           "Components:" & vbCrLf & msgParts & vbCrLf & vbCrLf & _
           "Mates: " & mateCount & vbCrLf & _
           "File: " & PROJ_PATH & ASSEMBLY_OUT & vbCrLf & vbCrLf & _
           "Check Immediate Window (Ctrl+G) for details.", _
           vbInformation, "Assembly Complete"
End Sub

'====================================================================
' MATE HELPER (coincident plane mate)
'====================================================================
Private Function MatePlanes(compAName As String, planeA As String, _
                            compBName As String, planeB As String, _
                            assyName As String) As Boolean
    MatePlanes = False

    Dim selA As String, selB As String
    selA = planeA & "@" & compAName & "@" & assyName
    selB = planeB & "@" & compBName & "@" & assyName

    Debug.Print "  Mate: " & selA & " = " & selB

    ' Clear selection
    g_swModel.ClearSelection2 True

    ' Select first plane (mark=1)
    Dim bRet As Boolean
    bRet = g_swModel.Extension.SelectByID2(selA, "PLANE", 0, 0, 0, False, 1, Nothing, 0)
    If Not bRet Then
        Debug.Print "    FAIL: Could not select " & selA
        Exit Function
    End If

    ' Select second plane (mark=2, append)
    bRet = g_swModel.Extension.SelectByID2(selB, "PLANE", 0, 0, 0, True, 2, Nothing, 0)
    If Not bRet Then
        Debug.Print "    FAIL: Could not select " & selB
        Exit Function
    End If

    ' Create mate data (0 = swMateTypeCoincident)
    Dim swMateData As Object
    On Error Resume Next
    Set swMateData = g_swModel.CreateMateData(0)
    On Error GoTo 0
    If swMateData Is Nothing Then
        Debug.Print "    FAIL: CreateMateData returned Nothing"
        Exit Function
    End If

    ' Get selected entities
    Dim entA As Object, entB As Object
    Set entA = g_swModel.SelectionManager.GetSelectedObject6(1, -1)
    Set entB = g_swModel.SelectionManager.GetSelectedObject6(2, -1)
    If entA Is Nothing Or entB Is Nothing Then
        Debug.Print "    FAIL: Could not get selected entities"
        Exit Function
    End If

    ' Set entities on mate data
    Dim entities(1) As Object
    Set entities(0) = entA
    Set entities(1) = entB
    swMateData.EntitiesToMate = entities
    swMateData.MateAlignment = 0  ' swMateAlignAligned

    ' Create the mate
    Dim swMateFeat As Object
    On Error Resume Next
    Set swMateFeat = g_swModel.CreateMate(swMateData)
    Dim mateErr As Long: mateErr = Err.Number
    On Error GoTo 0

    If swMateFeat Is Nothing Then
        Debug.Print "    FAIL: CreateMate returned Nothing (err=" & mateErr & ")"
        Exit Function
    End If

    Debug.Print "    OK: " & swMateFeat.Name
    g_swModel.ClearSelection2 True
    MatePlanes = True
End Function

'====================================================================
' REBUILD HELPER
'====================================================================
Private Sub RebuildSw()
    On Error Resume Next
    g_swModel.ForceRebuild3 True
    On Error GoTo 0
End Sub

'====================================================================
' UNIT CONVERSION HELPER
'====================================================================
Private Function m(mm As Double) As Double
    m = mm * MM
End Function
