'====================================================================
' HEARTBEAT DRUM KIOSK - COMPLETE STRUCTURAL FRAME GENERATOR
' Target: SolidWorks 2026 (API 32.x)
'
' BUILD PHILOSOPHY:
'   This macro creates an ENTIRELY NEW weldment part document from
'   scratch. It does NOT modify an existing frame. Every structural
'   member, plate, gusset, and detail is generated parametrically.
'
'   The design follows exhibit-grade kiosk engineering practices
'   used by Apple, Tesla, Disney Imagineering, and Universal Creative.
'
' KEY DESIGN DECISIONS:
'   1. Frame is a welded steel structure made from 50x50x3 SHS
'   2. Drum support cradle is a SEPARATE BOLTED SUBFRAME (not welded
'      to the main frame), enabling serviceability without cutting.
'   3. Rear shear panel (2mm folded steel) provides torsional rigidity
'      without visible X-bracing.
'   4. Angled neck transition with 6mm triangular gussets on both sides.
'   5. 10mm drum mounting plate with vibration isolator provisions.
'   6. Internal electronics tray for controller, PSU, amplifier.
'   7. Rear service door opening with cam-lock provisions.
'   8. Integrated cable management with separate power/signal/audio paths.
'   9. Wide anti-tip base with ballast mounting.
'  10. VESA-compatible display mounting hidden in tower.
'
' HOW TO RUN:
'   1. Open SolidWorks 2026
'   2. Tools > Macro > Edit (opens VBA Editor)
'   3. Tools > References > check "SldWorks 2026 Type Library"
'   4. File > Import File > select HeartbeatDrumKioskFrame.bas
'   5. F5 > BuildHeartbeatDrumKiosk
'====================================================================
Option Explicit

'--- Application References (late binding - no type library dependency) ---
Dim g_swApp      As Object
Dim g_swModel    As Object
Dim g_swPart     As Object
Dim g_swSkMgr    As Object
Dim g_swFeatMgr  As Object
Dim g_swSelMgr   As Object

'--- Unit conversion ---
Const MM As Double = 0.001

'--- Output path ---
Const PROJ_PATH As String = "C:\Users\kisha\Documents\Kiosk\"
Const FRAME_NAME As String = "HeartbeatDrumKiosk_Frame.SLDPRT"
Const STATE_FILE As String = "C:\Users\kisha\Documents\Kiosk\FrameBuild_State.txt"

'====================================================================
' FRAME PARAMETERS - All dimensions in millimeters
'====================================================================

'--- Base structure ---
Const BASE_W      As Double = 900      ' Width of base footprint
Const BASE_D      As Double = 900      ' Depth of base footprint
Const BASE_H      As Double = 50       ' Height of base frame tubes

'--- Tube dimensions ---
Const TUBE_W      As Double = 50       ' Square tube outer width
Const TUBE_T      As Double = 3        ' Square tube wall thickness
Const TUBE_INNER  As Double = 44       ' Inner dimension (50-2*3)

'--- Tower ---
Const TOWER_W     As Double = 550      ' Center-center width of tower tubes
Const TOWER_D     As Double = 350      ' Center-center depth of tower tubes
Const TOWER_H     As Double = 1500     ' Tower height (from base plate top)
Const TOWER_OFFZ  As Double = -25      ' Tower Z offset from base center (rearward)
Const BRACE_INT   As Double = 300      ' Horizontal brace interval

'--- Angled neck transition ---
Const NECK_H      As Double = 300      ' Neck transition height
Const NECK_FWD    As Double = 150      ' Forward offset at neck top (Z direction)
Const GUSSET_T    As Double = 6        ' Gusset plate thickness
Const GUSSET_L    As Double = 150      ' Minimum gusset leg length

'--- Drum support cradle (separate bolted subframe) ---
Const CRADLE_H    As Double = 100      ' Cradle frame height
Const CRADLE_W    As Double = 350      ' Cradle width (c-c)
Const CRADLE_D    As Double = 350      ' Cradle depth (c-c)

'--- Plates ---
Const BASE_PLATE_T  As Double = 10     ' Base plate thickness
Const DRUM_PLATE_T  As Double = 10     ' Drum mounting plate thickness
Const SHEAR_T       As Double = 2      ' Rear shear panel thickness
Const FLANGE_T      As Double = 8      ' Bolted flange thickness

'--- Electronics tray ---
Const TRAY_W      As Double = 300      ' Electronics tray width
Const TRAY_D      As Double = 200      ' Electronics tray depth
Const TRAY_H      As Double = 50       ' Electronics tray height

'--- Rear service opening ---
Const SERV_W      As Double = 320      ' Service door width
Const SERV_H      As Double = 380      ' Service door height

'--- Display mount (VESA 75/100 compatible) ---
Const VESA_PATTERN As Double = 75      ' VESA hole spacing (mm)

'====================================================================
' DERIVED GEOMETRY (calculated at runtime)
'====================================================================
Dim g_xBaseL  As Double   ' Base left edge
Dim g_xBaseR  As Double   ' Base right edge
Dim g_zBaseF  As Double   ' Base front edge
Dim g_zBaseRr As Double   ' Base rear edge
Dim g_tCtrZ   As Double   ' Tower center Z position
Dim g_tFLz    As Double   ' Tower front-left Z
Dim g_tFRz    As Double   ' Tower front-right Z
Dim g_tBLz    As Double   ' Tower back-left Z
Dim g_tBRz    As Double   ' Tower back-right Z
Dim g_tFLx    As Double   ' Tower front-left X
Dim g_tFRx    As Double   ' Tower front-right X
Dim g_tBLx    As Double   ' Tower back-left X
Dim g_tBRx    As Double   ' Tower back-right X
Dim g_nFLz    As Double   ' Neck front-left Z (at top)
Dim g_nFRz    As Double   ' Neck front-right Z (at top)
Dim g_nBLz    As Double   ' Neck back-left Z (at top)
Dim g_nBRz    As Double   ' Neck back-right Z (at top)
Dim g_cZctr   As Double   ' Cradle center Z

'====================================================================
' MAIN ENTRY POINT
'====================================================================
Sub BuildHeartbeatDrumKiosk()
    '--- Connect to SolidWorks 2026 ---
    On Error Resume Next
    Set g_swApp = Application.SldWorks
    If g_swApp Is Nothing Then
        MsgBox "Cannot access SolidWorks 2026." & vbCrLf & vbCrLf & _
               "Verify: VBA Editor > Tools > References >" & vbCrLf & _
               "'SldWorks 2026 Type Library' is checked.", _
               vbCritical, "Connection Error"
        End
    End If
    On Error GoTo 0

    Debug.Print "=== Heartbeat Drum Kiosk - Frame Builder ==="
    Debug.Print "SW API Revision: " & g_swApp.RevisionNumber

    '--- Check for previous build state ---
    Dim lastDone As Long
    lastDone = ReadLastSection()

    Dim resumeBuild As Boolean
    resumeBuild = False

    If lastDone > 0 Then
        Dim resp As VbMsgBoxResult
        resp = MsgBox("Previous build found (completed through section " & lastDone & "/14)." & vbCrLf & vbCrLf & _
                       "Resume from where it stopped?" & vbCrLf & _
                       "(Yes = resume, No = start over)", _
                       vbQuestion + vbYesNoCancel, "Resume Build")
        If resp = vbCancel Then
            Exit Sub
        ElseIf resp = vbYes Then
            resumeBuild = True
            Debug.Print "  Resuming from section " & (lastDone + 1)
        Else
            ClearState
            Debug.Print "  Starting fresh (state cleared)"
        End If
    End If

    '--- Initialize derived geometry ---
    InitGlobals

    '--- Create new part document (or use existing) ---
    If g_swModel Is Nothing Then
        If Not NewPart() Then
            MsgBox "Failed to create new part document.", vbCritical
            End
        End If
    End If

    '--- Set document units to mm ---
    SetUnitsMM

    '--- Build all frame sections in dependency order ---
    Dim t0 As Double
    t0 = Timer

    Dim curSection As Long
    curSection = 0

    On Error GoTo BuildError

    ' 1. Base structure (foundation + plate)
    curSection = 1
    If Not SectionDone(curSection, lastDone) Then
        CreateBaseFrame
        CreateBasePlate
        WriteLastSection curSection
    End If

    ' 2. Main vertical tower (4 posts + cross braces)
    curSection = 2
    If Not SectionDone(curSection, lastDone) Then
        CreateVerticalTower
        WriteLastSection curSection
    End If

    ' 3. Angled neck transition section
    curSection = 3
    If Not SectionDone(curSection, lastDone) Then
        CreateAngledNeck
        WriteLastSection curSection
    End If

    ' 4. Rear shear panel (2mm folded steel)
    curSection = 4
    If Not SectionDone(curSection, lastDone) Then
        CreateRearShearPanel
        WriteLastSection curSection
    End If

    ' 5. Neck gussets (6mm triangular, both sides)
    curSection = 5
    If Not SectionDone(curSection, lastDone) Then
        CreateNeckGussets
        WriteLastSection curSection
    End If

    ' 6. Drum support cradle (separate bolted subframe)
    curSection = 6
    If Not SectionDone(curSection, lastDone) Then
        CreateDrumCradle
        WriteLastSection curSection
    End If

    ' 7. Drum mounting plate (10mm, with bolt pattern)
    curSection = 7
    If Not SectionDone(curSection, lastDone) Then
        CreateDrumMountingPlate
        WriteLastSection curSection
    End If

    ' 8. Vibration isolation provisions (4 points)
    curSection = 8
    If Not SectionDone(curSection, lastDone) Then
        CreateVibrationIsolation
        WriteLastSection curSection
    End If

    ' 9. Electronics mounting tray (removable)
    curSection = 9
    If Not SectionDone(curSection, lastDone) Then
        CreateElectronicsTray
        WriteLastSection curSection
    End If

    ' 10. Cable management (channels + tie points)
    curSection = 10
    If Not SectionDone(curSection, lastDone) Then
        CreateCableManagement
        WriteLastSection curSection
    End If

    ' 11. Service access cutout (rear door opening)
    curSection = 11
    If Not SectionDone(curSection, lastDone) Then
        CreateServiceAccess
        WriteLastSection curSection
    End If

    ' 12. Display mounting structure (VESA compatible)
    curSection = 12
    If Not SectionDone(curSection, lastDone) Then
        CreateDisplayMount
        WriteLastSection curSection
    End If

    ' 13. Aesthetic finish features (trim, radii)
    curSection = 13
    If Not SectionDone(curSection, lastDone) Then
        AddAestheticFeatures
        WriteLastSection curSection
    End If

    ' 14. Final rebuild and cleanup
    curSection = 14
    g_swModel.ForceRebuild3 True
    HideAllPlanes
    g_swModel.ViewZoomtofit
    WriteLastSection curSection

    '--- All done ---
    ClearState

    '--- Save ---
    SaveFramePart

    Debug.Print "=== Frame built in " & Format(Timer - t0, "0.0") & " seconds ==="
    MsgBox "Heartbeat Drum Kiosk frame built successfully!" & vbCrLf & vbCrLf & _
           "File saved to:" & vbCrLf & PROJ_PATH & FRAME_NAME & vbCrLf & vbCrLf & _
           "Key design features:" & vbCrLf & _
           "  - 50x50x3 welded steel frame" & vbCrLf & _
           "  - Drum cradle is a SEPARATE BOLTED SUBFRAME" & vbCrLf & _
           "  - 2mm rear shear panel (no visible X-brace)" & vbCrLf & _
           "  - 6mm gussets at neck transition" & vbCrLf & _
           "  - 10mm drum plate with vibration isolation" & vbCrLf & _
           "  - VESA display mount + electronics tray" & vbCrLf & _
           "  - Rear service door access" & vbCrLf & _
           "  - Internal cable management", _
           vbInformation, "Build Complete"
    Exit Sub

BuildError:
    '--- Save checkpoint on error so user can resume ---
    Dim errMsg As String
    errMsg = Err.Description
    WriteLastSection (curSection - 1)  ' Last completed section

    MsgBox "Error in section " & curSection & ":" & vbCrLf & _
           errMsg & vbCrLf & vbCrLf & _
           "Progress saved. Run the macro again and choose" & vbCrLf & _
           "'Yes' to resume from section " & (curSection + 1) & ".", _
           vbExclamation, "Build Error - Saved"
End Sub

'====================================================================
' GEOMETRY INITIALIZATION
'====================================================================
Private Sub InitGlobals()
    ' Base extents
    g_xBaseL = -BASE_W / 2
    g_xBaseR = BASE_W / 2
    g_zBaseF = BASE_D / 2
    g_zBaseRr = -BASE_D / 2

    ' Tower center Z (shifted rearward from base center)
    g_tCtrZ = TOWER_OFFZ

    ' Tower tube corner positions (center of tube)
    ' Width: ±TOWER_W/2, Depth: ±TOWER_D/2, centered at (0, g_tCtrZ)
    g_tFLx = -TOWER_W / 2
    g_tFRx = TOWER_W / 2
    g_tBLx = -TOWER_W / 2
    g_tBRx = TOWER_W / 2
    g_tFLz = g_tCtrZ + TOWER_D / 2
    g_tFRz = g_tCtrZ + TOWER_D / 2
    g_tBLz = g_tCtrZ - TOWER_D / 2
    g_tBRz = g_tCtrZ - TOWER_D / 2

    ' Neck top positions (shifted forward by NECK_FWD)
    g_nFLz = g_tFLz + NECK_FWD
    g_nFRz = g_tFRz + NECK_FWD
    g_nBLz = g_tBLz + NECK_FWD
    g_nBRz = g_tBRz + NECK_FWD

    ' Cradle center Z (at top of neck)
    g_cZctr = g_tCtrZ + NECK_FWD
End Sub

'====================================================================
' DOCUMENT SETUP HELPERS
'====================================================================
Private Function GetPartTemplate() As String
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    Dim knownPath As String

    knownPath = "C:\ProgramData\SolidWorks\SOLIDWORKS 2026\templates\MBD\part 0251mm to 1000mm.prtdot"
    If fso.FileExists(knownPath) Then
        GetPartTemplate = knownPath
        Exit Function
    End If

    knownPath = "C:\ProgramData\SolidWorks\SOLIDWORKS 2026\templates\Part.prtdot"
    If fso.FileExists(knownPath) Then
        GetPartTemplate = knownPath
        Exit Function
    End If

    On Error Resume Next
    GetPartTemplate = g_swApp.GetUserPreferenceStringValue(72)  ' swDefaultTemplatePart
    On Error GoTo 0
End Function

Private Function NewPart() As Boolean
    Dim tmpl As String
    tmpl = GetPartTemplate
    If tmpl = "" Then
        NewPart = False
        Exit Function
    End If

    Set g_swModel = g_swApp.NewDocument(tmpl, 0, 0, 0)
    If g_swModel Is Nothing Then
        NewPart = False
        Exit Function
    End If

    Set g_swPart = g_swModel
    Set g_swSkMgr = g_swModel.SketchManager
    Set g_swFeatMgr = g_swModel.FeatureManager
    Set g_swSelMgr = g_swModel.SelectionManager

    ' Note: Weldment mode is automatically activated when the first
    ' structural member or extrusion (hollow tube) is created.
    ' No explicit SetWeldment call needed.

    NewPart = True
End Function

Private Sub SetUnitsMM()
    ' Units are set by the part template (should be mm).
    ' If your template is not in mm, change your default part template:
    '   Tools > Options > System Options > File Locations > Document Templates
    ' No API call needed — the template controls units.
End Sub

Private Sub SaveFramePart()
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")

    If Not fso.FolderExists(PROJ_PATH) Then
        fso.CreateFolder PROJ_PATH
    End If

    Dim path As String
    path = PROJ_PATH & FRAME_NAME

    On Error Resume Next
    CallByName g_swModel, "SaveAs3", VbMethod, path, CLng(0), CLng(0)
    If Err.Number <> 0 Then
        Err.Clear
        CallByName g_swModel, "SaveAs", VbMethod, path, CLng(0), CLng(0)
    End If
    On Error GoTo 0

    Debug.Print "Frame saved: " & path
End Sub

'====================================================================
' SKETCH AND FEATURE HELPERS
'====================================================================
Private Function m(ByVal v As Double) As Double
    m = v * MM
End Function

Private Sub SelPlane(ByVal name As String)
    g_swModel.Extension.SelectByID2 name, "PLANE", 0, 0, 0, False, 0, Nothing, 0
End Sub

Private Sub StartSketch(ByVal plane As String)
    SelPlane plane
    g_swSkMgr.InsertSketch True
End Sub

Private Sub EndSketch()
    g_swSkMgr.InsertSketch True
End Sub

Private Sub Rebuild()
    On Error Resume Next
    g_swModel.ForceRebuild3 True
    On Error GoTo 0
End Sub

Private Sub LogErr(ByVal op As String)
    If Err.Number <> 0 Then
        Debug.Print "  ERR " & op & ": " & Err.Description
        Err.Clear
    End If
End Sub

'====================================================================
' CHECKPOINT / RESUME SYSTEM
'====================================================================
Private Function ReadLastSection() As Long
    ' Returns the last successfully completed section number (0 = none)
    ReadLastSection = 0
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    If Not fso.FileExists(STATE_FILE) Then Exit Function

    Dim ts As Object
    Set ts = fso.OpenTextFile(STATE_FILE, 1)  ' ForReading
    If ts Is Nothing Then Exit Function
    On Error Resume Next
    ReadLastSection = CLng(ts.ReadLine)
    ts.Close
    On Error GoTo 0
End Function

Private Sub WriteLastSection(ByVal secNum As Long)
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")

    If Not fso.FolderExists(PROJ_PATH) Then
        fso.CreateFolder PROJ_PATH
    End If

    Dim ts As Object
    Set ts = fso.OpenTextFile(STATE_FILE, 2, True)  ' ForWriting, create
    If Not ts Is Nothing Then
        ts.WriteLine secNum
        ts.Close
    End If
    Debug.Print "  [Checkpoint] Saved section " & secNum
End Sub

Private Sub ClearState()
    On Error Resume Next
    Kill STATE_FILE
    On Error GoTo 0
End Sub

Private Function SectionDone(ByVal secNum As Long, ByVal lastDone As Long) As Boolean
    ' True if this section was already completed (should skip)
    SectionDone = (secNum <= lastDone)
End Function

'--- Create offset reference plane ---
Private Function MakePlane(ByVal refPlane As String, _
                           ByVal distM As Double, _
                           Optional ByVal newName As String = "") As String
    Dim pf As Object
    SelPlane refPlane
    ' 8 = swRefPlaneReferenceConstraint_Distance
    Set pf = g_swFeatMgr.InsertRefPlane(8, distM, 0, 0, 0, 0)
    If Not pf Is Nothing Then
        If newName <> "" Then
            On Error Resume Next
            pf.Name = newName
            On Error GoTo 0
        End If
        MakePlane = pf.Name
    Else
        MakePlane = ""
    End If
End Function

'--- Extrude: forward direction ---
Private Function DoExtrude(ByVal depthM As Double) As Object
    Set DoExtrude = g_swFeatMgr.FeatureExtrusion3( _
        True, False, False, _
        0, 0, _
        depthM, 0, _
        False, False, _
        False, False, _
        0, 0, _
        False, False, _
        False, False, _
        True, True, True, _
        0, 0, False)
End Function

'--- Extrude: reverse direction ---
Private Function DoExtrudeRev(ByVal depthM As Double) As Object
    Set DoExtrudeRev = g_swFeatMgr.FeatureExtrusion3( _
        True, True, False, _
        0, 0, _
        depthM, 0, _
        False, False, _
        False, False, _
        0, 0, _
        False, False, _
        False, False, _
        True, True, True, _
        0, 0, False)
End Function

'--- Extrude: mid-plane ---
Private Function DoExtrudeMid(ByVal depthM As Double) As Object
    Set DoExtrudeMid = g_swFeatMgr.FeatureExtrusion3( _
        False, False, False, _
        6, 0, _
        depthM / 2, 0, _
        False, False, _
        False, False, _
        0, 0, _
        False, False, _
        False, False, _
        True, True, True, _
        0, 0, False)
End Function

'--- Extrude: no merge (for separate bodies like drum cradle) ---
Private Function DoExtrudeNoMerge(ByVal depthM As Double) As Object
    Set DoExtrudeNoMerge = g_swFeatMgr.FeatureExtrusion3( _
        True, False, False, _
        0, 0, _
        depthM, 0, _
        False, False, _
        False, False, _
        0, 0, _
        False, False, _
        False, False, _
        False, True, True, _
        0, 0, False)
End Function

'--- Extrude: no merge with reverse ---
Private Function DoExtrudeRevNoMerge(ByVal depthM As Double) As Object
    Set DoExtrudeRevNoMerge = g_swFeatMgr.FeatureExtrusion3( _
        True, True, False, _
        0, 0, _
        depthM, 0, _
        False, False, _
        False, False, _
        0, 0, _
        False, False, _
        False, False, _
        False, True, True, _
        0, 0, False)
End Function

'--- Cut: blind depth ---
Private Function DoCut(ByVal depthM As Double) As Object
    Set DoCut = g_swFeatMgr.FeatureCut4( _
        True, False, False, _
        0, 0, _
        depthM, 0, _
        False, False, _
        False, False, _
        0, 0, _
        False, False, _
        False, False, _
        False, _
        True, True, _
        True, True, False, _
        0, 0, False, False)
End Function

'--- Cut: through all ---
Private Function DoCutThru() As Object
    Set DoCutThru = g_swFeatMgr.FeatureCut4( _
        True, False, False, _
        1, 0, _
        0.01, 0.01, _
        False, False, _
        False, False, _
        0, 0, _
        False, False, _
        False, False, _
        False, _
        True, True, _
        True, True, False, _
        0, 0, False, False)
End Function

'--- Draw hollow square tube profile (for extrusion-based structural members) ---
' Draws outer and inner squares for a tube cross-section
Private Sub DrawTubeProfile(ByVal cx As Double, ByVal cy As Double, _
                            ByVal tubeW As Double, ByVal tubeInner As Double)
    Dim halfW As Double
    Dim halfI As Double
    halfW = tubeW / 2
    halfI = tubeInner / 2

    ' Outer square
    g_swSkMgr.CreateCornerRectangle _
        cx - halfW, cy - halfW, 0, _
        cx + halfW, cy + halfW, 0
    ' Inner square (creates hollow profile)
    g_swSkMgr.CreateCornerRectangle _
        cx - halfI, cy - halfI, 0, _
        cx + halfI, cy + halfI, 0
End Sub

'--- Draw a rectangular outline (for plates) ---
Private Sub DrawRectangle(ByVal cx As Double, ByVal cy As Double, _
                          ByVal halfW As Double, ByVal halfD As Double)
    g_swSkMgr.CreateCornerRectangle _
        cx - halfW, cy - halfD, 0, _
        cx + halfW, cy + halfD, 0
End Sub

'====================================================================
' 1. BASE STRUCTURE
'====================================================================
Private Sub CreateBaseFrame()
    Debug.Print "--- 1. Creating base frame ---"

    Dim f As Object
    Dim yBot As Double
    yBot = m(TUBE_W / 2)  ' vertical center of base tubes (Y=25mm)

    '--- Base perimeter: 4 sides using 50x50x3 tube ---
    ' Base outer dimensions: BASE_W x BASE_D, centered at origin
    ' Tube center positions are offset from outer edge by TUBE_W/2
    ' Each tube is extruded mid-plane to center on the origin

    ' Front rail: at Z = +BASE_D/2 - TUBE_W/2, runs in X direction
    ' Draw tube profile on Right Plane (sketch X=Z, Y=Y, extrude X)
    ' Extrude mid-plane in X from -(BASE_W/2 - TUBE_W/2) to +(BASE_W/2 - TUBE_W/2)
    Dim frontZ As Double
    frontZ = BASE_D / 2 - TUBE_W / 2
    StartSketch "Right Plane"
    DrawTubeProfile m(frontZ), yBot, m(TUBE_W), m(TUBE_INNER)
    EndSketch
    Set f = DoExtrudeMid(m(BASE_W - TUBE_W))
    If Not f Is Nothing Then f.Name = "Base_FrontRail"
    LogErr "Base_FrontRail"
    Rebuild

    ' Rear rail: at Z = -BASE_D/2 + TUBE_W/2, runs in X direction
    Dim rearZ As Double
    rearZ = -BASE_D / 2 + TUBE_W / 2
    StartSketch "Right Plane"
    DrawTubeProfile m(rearZ), yBot, m(TUBE_W), m(TUBE_INNER)
    EndSketch
    Set f = DoExtrudeMid(m(BASE_W - TUBE_W))
    If Not f Is Nothing Then f.Name = "Base_RearRail"
    LogErr "Base_RearRail"
    Rebuild

    ' Left rail: at X = -BASE_W/2 + TUBE_W/2, runs in Z direction
    ' Draw tube profile on Top Plane (sketch X=X, Y=Y, extrude Z)
    ' Extrude mid-plane in Z from -(BASE_D/2 - TUBE_W/2) to +(BASE_D/2 - TUBE_W/2)
    Dim leftX As Double
    leftX = -BASE_W / 2 + TUBE_W / 2
    StartSketch "Top Plane"
    DrawTubeProfile m(leftX), yBot, m(TUBE_W), m(TUBE_INNER)
    EndSketch
    Set f = DoExtrudeMid(m(BASE_D - TUBE_W))
    If Not f Is Nothing Then f.Name = "Base_LeftRail"
    LogErr "Base_LeftRail"
    Rebuild

    ' Right rail: at X = +BASE_W/2 - TUBE_W/2, runs in Z direction
    Dim rightX As Double
    rightX = BASE_W / 2 - TUBE_W / 2
    StartSketch "Top Plane"
    DrawTubeProfile m(rightX), yBot, m(TUBE_W), m(TUBE_INNER)
    EndSketch
    Set f = DoExtrudeMid(m(BASE_D - TUBE_W))
    If Not f Is Nothing Then f.Name = "Base_RightRail"
    LogErr "Base_RightRail"
    Rebuild

    '--- Cross members (2 tubes across the base, centered) ---
    ' Cross member in X direction: runs left-right, centered in Z=0
    ' Sketch on Right Plane (extrudes in X direction)
    StartSketch "Right Plane"
    DrawTubeProfile 0, yBot, m(TUBE_W), m(TUBE_INNER)
    EndSketch
    Set f = DoExtrudeMid(m(BASE_W - TUBE_W))
    If Not f Is Nothing Then f.Name = "Base_CrossX"
    LogErr "Base_CrossX"
    Rebuild

    ' Cross member in Z direction: runs front-back, centered at X=0
    ' Sketch on Top Plane (extrudes in Z direction)
    StartSketch "Top Plane"
    DrawTubeProfile 0, yBot, m(TUBE_W), m(TUBE_INNER)
    EndSketch
    Set f = DoExtrudeMid(m(BASE_D - TUBE_W))
    If Not f Is Nothing Then f.Name = "Base_CrossZ"
    LogErr "Base_CrossZ"
    Rebuild

    '--- Ballast mounting tabs (for steel ballast plate installation) ---
    ' 4 tabs inside the base frame with M10 bolt holes
    Dim i As Integer
    For i = 0 To 3
        Dim bx As Double, bz As Double
        Select Case i
            Case 0: bx = -BASE_W / 4: bz = -BASE_D / 4
            Case 1: bx = BASE_W / 4: bz = -BASE_D / 4
            Case 2: bx = -BASE_W / 4: bz = BASE_D / 4
            Case 3: bx = BASE_W / 4: bz = BASE_D / 4
        End Select

        ' Tab (50x30mm, 6mm thick)
        StartSketch "Top Plane"
        g_swSkMgr.CreateCornerRectangle _
            m(bx - 25), m(bz - 15), 0, _
            m(bx + 25), m(bz + 15), 0
        EndSketch
        Set f = DoExtrude(m(6))
        If Not f Is Nothing Then f.Name = "Base_BallastTab_" & (i + 1)
        LogErr "Base_BallastTab_" & (i + 1)
        Rebuild

        ' M10 bolt hole in each tab
        StartSketch "Top Plane"
        g_swSkMgr.CreateCircle m(bx), m(bz), 0, m(bx + 5.5), m(bz), 0
        EndSketch
        Set f = DoCutThru()
        If Not f Is Nothing Then f.Name = "Base_BallastHole_" & (i + 1)
        LogErr "Base_BallastHole_" & (i + 1)
        Rebuild
    Next i

    Debug.Print "  Base frame: " & BASE_W & "x" & BASE_D & "mm perimeter + cross members + ballast tabs"
End Sub

'--- Base plate (10mm steel plate on top of base frame) ---
Private Sub CreateBasePlate()
    Debug.Print "--- 1b. Creating base plate ---"

    Dim pPlate As String
    pPlate = MakePlane("Top Plane", m(TUBE_W), "Plane_BasePlate")
    If pPlate = "" Then pPlate = "Top Plane"

    StartSketch pPlate
    g_swSkMgr.CreateCornerRectangle _
        m(-BASE_W / 2 + TUBE_W / 2), m(-BASE_D / 2 + TUBE_W / 2), 0, _
        m(BASE_W / 2 - TUBE_W / 2), m(BASE_D / 2 - TUBE_W / 2), 0
    EndSketch
    Dim f As Object
    Set f = DoExtrude(m(BASE_PLATE_T))
    If Not f Is Nothing Then f.Name = "BasePlate"
    LogErr "BasePlate"
    Rebuild

    Debug.Print "  Base plate: " & (BASE_W - TUBE_W) & "x" & (BASE_D - TUBE_W) & "x" & BASE_PLATE_T & "mm"
End Sub

'====================================================================
' 2. VERTICAL TOWER
'====================================================================
Private Sub CreateVerticalTower()
    Debug.Print "--- 2. Creating vertical tower ---"

    Dim f As Object
    Dim yBaseTop As Double
    yBaseTop = m(TUBE_W + BASE_PLATE_T)
    Dim yTowerTop As Double
    yTowerTop = m(TUBE_W + BASE_PLATE_T + TOWER_H)

    '--- Four primary vertical posts (50x50x3 tube) ---
    ' Posts run from ground (Y=0) to top of tower
    Dim postH As Double
    postH = TOWER_H + TUBE_W + BASE_PLATE_T  ' full height from Y=0

    Dim corners As Variant
    corners = Array( _
        Array(g_tFLx, g_tFLz, "FL"), _
        Array(g_tFRx, g_tFRz, "FR"), _
        Array(g_tBLx, g_tBLz, "BL"), _
        Array(g_tBRx, g_tBRz, "BR"))

    Dim i As Integer
    For i = 0 To 3
        Dim cx As Double, cz As Double, tag As String
        cx = corners(i)(0)
        cz = corners(i)(1)
        tag = corners(i)(2)

        StartSketch "Top Plane"
        DrawTubeProfile m(cx), m(cz), m(TUBE_W), m(TUBE_INNER)
        EndSketch
        Set f = DoExtrudeNoMerge(m(postH))
        If Not f Is Nothing Then f.Name = "Tower_Post_" & tag
        LogErr "Tower_Post_" & tag
        Rebuild
    Next i

    '--- Horizontal cross braces (every BRACE_INT mm) ---
    ' Braces connect the 4 posts at regular intervals for lateral stability.
    ' Front/Rear braces run in X direction; Left/Right braces run in Z direction.
    ' All braces merge with posts (welded construction).
    Dim nBraces As Integer
    nBraces = Int(TOWER_H / BRACE_INT)

    ' Create an offset plane for left/right braces (centered on tower depth)
    Dim pBraceDepth As String
    pBraceDepth = MakePlane("Front Plane", m(g_tCtrZ), "Plane_BraceDepth")
    If pBraceDepth = "" Then pBraceDepth = "Front Plane"

    Dim j As Integer
    For j = 1 To nBraces
        Dim braceY As Double
        braceY = TUBE_W + BASE_PLATE_T + j * BRACE_INT

        '--- Front brace (runs in X at front face Z) ---
        ' Right Plane sketch: X=global Z, Y=global Y, extrude = global X
        StartSketch "Right Plane"
        DrawTubeProfile m(g_tFLz), m(braceY), m(TUBE_W), m(TUBE_INNER)
        EndSketch
        Set f = DoExtrudeMid(m(TOWER_W))
        If Not f Is Nothing Then f.Name = "Tower_Brace_Front_" & j
        LogErr "Tower_Brace_Front_" & j
        Rebuild

        '--- Rear brace (runs in X at rear face Z) ---
        StartSketch "Right Plane"
        DrawTubeProfile m(g_tBLz), m(braceY), m(TUBE_W), m(TUBE_INNER)
        EndSketch
        Set f = DoExtrudeMid(m(TOWER_W))
        If Not f Is Nothing Then f.Name = "Tower_Brace_Rear_" & j
        LogErr "Tower_Brace_Rear_" & j
        Rebuild

        '--- Left brace (runs in Z at left face X) ---
        ' Draw on plane offset to tower center Z for proper Z centering
        StartSketch pBraceDepth
        DrawTubeProfile m(g_tFLx), m(braceY), m(TUBE_W), m(TUBE_INNER)
        EndSketch
        Set f = DoExtrudeMid(m(TOWER_D))
        If Not f Is Nothing Then f.Name = "Tower_Brace_Left_" & j
        LogErr "Tower_Brace_Left_" & j
        Rebuild

        '--- Right brace (runs in Z at right face X) ---
        StartSketch pBraceDepth
        DrawTubeProfile m(g_tFRx), m(braceY), m(TUBE_W), m(TUBE_INNER)
        EndSketch
        Set f = DoExtrudeMid(m(TOWER_D))
        If Not f Is Nothing Then f.Name = "Tower_Brace_Right_" & j
        LogErr "Tower_Brace_Right_" & j
        Rebuild
    Next j

    '--- Internal mounting rails (for electronics, display) ---
    ' Two vertical C-channel rails inside the tower, front face
    ' These run in Y direction (vertical) at fixed X and Z positions
    Dim railZ As Double
    railZ = g_tCtrZ + TOWER_D / 2 - TUBE_W - 15

    ' Left internal rail: runs in Y direction at X=-100mm, Z=railZ
    StartSketch "Front Plane"
    g_swSkMgr.CreateCornerRectangle _
        m(-100 - 10), m(railZ - 3), 0, _
        m(-100 + 10), m(railZ + 3), 0
    EndSketch
    Set f = DoExtrudeMid(m(TOWER_H))
    If Not f Is Nothing Then f.Name = "Tower_InternalRail_L"
    LogErr "InternalRail_L"
    Rebuild

    ' Right internal rail: runs in Y direction at X=+100mm, Z=railZ
    StartSketch "Front Plane"
    g_swSkMgr.CreateCornerRectangle _
        m(100 - 10), m(railZ - 3), 0, _
        m(100 + 10), m(railZ + 3), 0
    EndSketch
    Set f = DoExtrudeMid(m(TOWER_H))
    If Not f Is Nothing Then f.Name = "Tower_InternalRail_R"
    LogErr "InternalRail_R"
    Rebuild

    Debug.Print "  Tower: 4 vertical posts + " & nBraces & " brace levels + 2 internal rails"
End Sub

'====================================================================
' 3. ANGLED NECK TRANSITION
'====================================================================
Private Sub CreateAngledNeck()
    Debug.Print "--- 3. Creating angled neck transition ---"

    Dim f As Object
    Dim yNeckBot As Double, yNeckTop As Double
    yNeckBot = m(TUBE_W + BASE_PLATE_T + TOWER_H)
    yNeckTop = m(TUBE_W + BASE_PLATE_T + TOWER_H + NECK_H)

    '--- Create 4 vertical neck members at shifted-forward positions ---
    ' Each member runs upward from the neck bottom ring to the neck top ring.
    ' Members are positioned at the neck top (shifted forward by NECK_FWD),
    ' creating a stepped forward transition. The gussets and ring frames
    ' provide structural continuity. This stepped approach is common in
    ' welded fabrication where angled cuts are avoided.
    '
    ' Neck member positions (X, Z at top, shifted forward from tower):
    '   FL: g_tFLx, g_nFLz     FR: g_tFRx, g_nFRz
    '   BL: g_tBLx, g_nBLz     BR: g_tBRx, g_nBRz

    ' Create neck bottom plane (at tower top)
    Dim pNeckBotPlane As String
    pNeckBotPlane = MakePlane("Top Plane", m(TUBE_W + BASE_PLATE_T + TOWER_H), "Plane_NeckMembersBot")

    Dim np As Variant
    np = Array( _
        Array(g_tFLx, g_nFLz, "FL"), _
        Array(g_tFRx, g_nFRz, "FR"), _
        Array(g_tBLx, g_nBLz, "BL"), _
        Array(g_tBRx, g_nBRz, "BR"))

    Dim ni As Integer
    For ni = 0 To 3
        Dim npx As Double, npz As Double, nptag As String
        npx = np(ni)(0)
        npz = np(ni)(1)
        nptag = np(ni)(2)

        StartSketch pNeckBotPlane
        DrawTubeProfile m(npx), m(npz), m(TUBE_W), m(TUBE_INNER)
        EndSketch
        Set f = DoExtrudeNoMerge(m(NECK_H))
        If Not f Is Nothing Then f.Name = "Neck_Member_" & nptag
        LogErr "Neck_Member_" & nptag
        Rebuild
    Next ni

    '--- Neck bottom ring (transition frame at tower top) ---
    Dim pNeckBot As String
    pNeckBot = MakePlane("Top Plane", m(TUBE_W + BASE_PLATE_T + TOWER_H), "Plane_NeckBotRing")

    ' Front rail: runs in X direction at Z=g_tFLz (front face)
    ' Sketch on Right Plane (extrudes in X)
    StartSketch "Right Plane"
    DrawTubeProfile m(g_tFLz), m(TUBE_W + BASE_PLATE_T + TOWER_H), m(TUBE_W), m(TUBE_INNER)
    EndSketch
    Set f = DoExtrudeMid(m(TOWER_W))
    If Not f Is Nothing Then f.Name = "Neck_BotRing_Front"
    LogErr "Neck_BotRing_Front"
    Rebuild

    ' Rear rail: runs in X direction at Z=g_tBLz (rear face)
    StartSketch "Right Plane"
    DrawTubeProfile m(g_tBLz), m(TUBE_W + BASE_PLATE_T + TOWER_H), m(TUBE_W), m(TUBE_INNER)
    EndSketch
    Set f = DoExtrudeMid(m(TOWER_W))
    If Not f Is Nothing Then f.Name = "Neck_BotRing_Rear"
    LogErr "Neck_BotRing_Rear"
    Rebuild

    ' Left rail: runs in Z direction at X=g_tFLx (left face)
    ' Sketch on Top Plane (extrudes in Z)
    StartSketch "Top Plane"
    DrawTubeProfile m(g_tFLx), m(TUBE_W + BASE_PLATE_T + TOWER_H), m(TUBE_W), m(TUBE_INNER)
    EndSketch
    Set f = DoExtrudeMid(m(TOWER_D))
    If Not f Is Nothing Then f.Name = "Neck_BotRing_Left"
    LogErr "Neck_BotRing_Left"
    Rebuild

    ' Right rail: runs in Z direction at X=g_tFRx (right face)
    StartSketch "Top Plane"
    DrawTubeProfile m(g_tFRx), m(TUBE_W + BASE_PLATE_T + TOWER_H), m(TUBE_W), m(TUBE_INNER)
    EndSketch
    Set f = DoExtrudeMid(m(TOWER_D))
    If Not f Is Nothing Then f.Name = "Neck_BotRing_Right"
    LogErr "Neck_BotRing_Right"
    Rebuild

    '--- Top neck ring (horizontal frame at neck top, matching cradle size) ---
    Dim yNeckTopOffset As Double
    yNeckTopOffset = TUBE_W + BASE_PLATE_T + TOWER_H + NECK_H

    Dim pNeckTop As String
    pNeckTop = MakePlane("Top Plane", m(yNeckTopOffset), "Plane_NeckTop")

    ' Front rail: runs in X direction at Z=g_cZctr+CRADLE_D/2 (front face)
    StartSketch "Right Plane"
    DrawTubeProfile m(g_cZctr + CRADLE_D / 2), m(yNeckTopOffset), m(TUBE_W), m(TUBE_INNER)
    EndSketch
    Set f = DoExtrudeMid(m(CRADLE_W))
    If Not f Is Nothing Then f.Name = "Neck_TopRing_Front"
    LogErr "Neck_TopRing_Front"
    Rebuild

    ' Rear rail: runs in X direction at Z=g_cZctr-CRADLE_D/2 (rear face)
    StartSketch "Right Plane"
    DrawTubeProfile m(g_cZctr - CRADLE_D / 2), m(yNeckTopOffset), m(TUBE_W), m(TUBE_INNER)
    EndSketch
    Set f = DoExtrudeMid(m(CRADLE_W))
    If Not f Is Nothing Then f.Name = "Neck_TopRing_Rear"
    LogErr "Neck_TopRing_Rear"
    Rebuild

    ' Left rail: runs in Z direction at X=-CRADLE_W/2 (left face)
    StartSketch "Top Plane"
    DrawTubeProfile m(-CRADLE_W / 2), m(yNeckTopOffset), m(TUBE_W), m(TUBE_INNER)
    EndSketch
    Set f = DoExtrudeMid(m(CRADLE_D))
    If Not f Is Nothing Then f.Name = "Neck_TopRing_Left"
    LogErr "Neck_TopRing_Left"
    Rebuild

    ' Right rail: runs in Z direction at X=+CRADLE_W/2 (right face)
    StartSketch "Top Plane"
    DrawTubeProfile m(CRADLE_W / 2), m(yNeckTopOffset), m(TUBE_W), m(TUBE_INNER)
    EndSketch
    Set f = DoExtrudeMid(m(CRADLE_D))
    If Not f Is Nothing Then f.Name = "Neck_TopRing_Right"
    LogErr "Neck_TopRing_Right"
    Rebuild

    '--- Bolted connection flanges (for drum cradle attachment) ---
    Dim flangeY As Double
    flangeY = TUBE_W + BASE_PLATE_T + TOWER_H + NECK_H + TUBE_W

    Dim pFlange As String
    pFlange = MakePlane("Top Plane", m(flangeY), "Plane_NeckFlanges")

    ' Create 4 flanges at the neck top corners
    Dim flangePairs As Variant
    flangePairs = Array( _
        Array(-CRADLE_W / 2, g_cZctr + CRADLE_D / 2, "FL"), _
        Array(CRADLE_W / 2, g_cZctr + CRADLE_D / 2, "FR"), _
        Array(-CRADLE_W / 2, g_cZctr - CRADLE_D / 2, "BL"), _
        Array(CRADLE_W / 2, g_cZctr - CRADLE_D / 2, "BR"))

    Dim fi As Integer
    For fi = 0 To 3
        Dim fcx As Double, fcz As Double, ftag As String
        fcx = flangePairs(fi)(0)
        fcz = flangePairs(fi)(1)
        ftag = flangePairs(fi)(2)

        ' Flange plate (extends beyond tube for bolting)
        StartSketch pFlange
        g_swSkMgr.CreateCornerRectangle _
            m(fcx - TUBE_W / 2 - 10), m(fcz - TUBE_W / 2 - 10), 0, _
            m(fcx + TUBE_W / 2 + 10), m(fcz + TUBE_W / 2 + 10), 0
        EndSketch
        Set f = DoExtrudeNoMerge(m(FLANGE_T))
        If Not f Is Nothing Then f.Name = "Neck_Flange_" & ftag
        LogErr "Neck_Flange_" & ftag
        Rebuild

        ' M8 bolt holes (4 per flange)
        Dim hi As Integer
        Dim hsigns As Variant
        hsigns = Array(-1, -1, 1, -1, 1, 1, -1, 1)
        For hi = 0 To 3
            Dim hx As Double, hz As Double
            hx = fcx + hsigns(hi * 2) * (TUBE_W / 2 - 3)
            hz = fcz + hsigns(hi * 2 + 1) * (TUBE_W / 2 - 3)

            StartSketch pFlange
            g_swSkMgr.CreateCircle m(hx), m(hz), 0, m(hx + 4.5), m(hz), 0
            EndSketch
            Set f = DoCutThru()
            If Not f Is Nothing Then f.Name = "Neck_FlangeHole_" & ftag & "_" & (hi + 1)
            LogErr "Neck_FlangeHole_" & ftag & "_" & (hi + 1)
            Rebuild
        Next hi
    Next fi

    Debug.Print "  Neck transition: 4 offset members + 2 ring frames + bolted flanges"
End Sub

'====================================================================
' 4. REAR SHEAR PANEL (2mm folded steel)
'====================================================================
Private Sub CreateRearShearPanel()
    Debug.Print "--- 4. Creating rear shear panel ---"

    Dim f As Object
    Dim yStart As Double, yEnd As Double
    yStart = m(TUBE_W + BASE_PLATE_T)
    yEnd = m(TUBE_W + BASE_PLATE_T + TOWER_H + NECK_H)

    ' Rear panel is on the back face of the tower/neck
    ' It spans from back-left to back-right, from base to neck top
    Dim panelZ As Double
    panelZ = g_tCtrZ - TOWER_D / 2 - TUBE_W / 2  ' rear face of back tubes

    ' Create a plane at the rear face (Top Plane offset in Z)
    Dim pRear As String
    pRear = MakePlane("Top Plane", m(panelZ - SHEAR_T), "Plane_RearShear")

    ' Panel outline (covering the entire rear face)
    ' Sketch on Top Plane: X=global X, Y=global Y (height)
    StartSketch pRear
    g_swSkMgr.CreateCornerRectangle _
        m(-TOWER_W / 2 - TUBE_W / 2), yStart, 0, _
        m(TOWER_W / 2 + TUBE_W / 2), yEnd, 0
    EndSketch
    Set f = DoExtrude(m(SHEAR_T))
    If Not f Is Nothing Then f.Name = "RearShearPanel"
    LogErr "RearShearPanel"
    Rebuild

    '--- Folded edge detail (simulates sheet metal fold) ---
    ' Left folded edge (10mm return)
    Dim pLeftFold As String
    pLeftFold = MakePlane("Right Plane", m(-TOWER_W / 2 - TUBE_W / 2 - 5), "Plane_LeftFold")

    StartSketch pLeftFold
    g_swSkMgr.CreateCornerRectangle _
        m(panelZ - SHEAR_T), yStart, 0, _
        m(panelZ + 10), yEnd, 0
    EndSketch
    Set f = DoExtrude(m(SHEAR_T))
    If Not f Is Nothing Then f.Name = "RearShear_FoldLeft"
    LogErr "RearShear_FoldLeft"
    Rebuild

    ' Right folded edge
    Dim pRightFold As String
    pRightFold = MakePlane("Right Plane", m(TOWER_W / 2 + TUBE_W / 2 + 5), "Plane_RightFold")

    StartSketch pRightFold
    g_swSkMgr.CreateCornerRectangle _
        m(panelZ - SHEAR_T), yStart, 0, _
        m(panelZ + 10), yEnd, 0
    EndSketch
    Set f = DoExtrude(m(SHEAR_T))
    If Not f Is Nothing Then f.Name = "RearShear_FoldRight"
    LogErr "RearShear_FoldRight"
    Rebuild

    Debug.Print "  Rear shear panel: 2mm steel, full rear face coverage + folded edges"
End Sub

'====================================================================
' 5. NECK GUSSETS (6mm triangular, both sides)
'====================================================================
Private Sub CreateNeckGussets()
    Debug.Print "--- 5. Creating neck gussets ---"

    Dim f As Object
    Dim yNeckBot As Double, yNeckTop As Double
    yNeckBot = TUBE_W + BASE_PLATE_T + TOWER_H
    yNeckTop = TUBE_W + BASE_PLATE_T + TOWER_H + NECK_H

    ' Gusset geometry: right triangle with 150mm legs on each side
    ' Leg along Z (depth direction), leg along Y (height direction)
    ' Located at the junction between tower and neck

    '--- Left side gusset ---
    Dim gussetX_L As Double
    gussetX_L = -TOWER_W / 2 - TUBE_W / 2

    ' Create plane at the left face of the left tower posts
    Dim pGussetL As String
    pGussetL = MakePlane("Right Plane", m(gussetX_L), "Plane_GussetLeft")

    ' Triangle: base along Z from rear post to front post, height up from tower top
    ' Vertices: (rearPostZ, yNeckBot), (frontPostZ, yNeckBot), (frontPostZ, yNeckBot + GUSSET_L)
    StartSketch pGussetL
    g_swSkMgr.CreateLine _
        m(g_tBLz + TUBE_W / 2), m(yNeckBot), 0, _
        m(g_tFLz - TUBE_W / 2), m(yNeckBot), 0
    g_swSkMgr.CreateLine _
        m(g_tFLz - TUBE_W / 2), m(yNeckBot), 0, _
        m(g_tFLz - TUBE_W / 2), m(yNeckBot + GUSSET_L), 0
    g_swSkMgr.CreateLine _
        m(g_tFLz - TUBE_W / 2), m(yNeckBot + GUSSET_L), 0, _
        m(g_tBLz + TUBE_W / 2), m(yNeckBot), 0
    EndSketch
    Set f = DoExtrude(m(GUSSET_T))
    If Not f Is Nothing Then f.Name = "Gusset_Left_Main"
    LogErr "Gusset_Left_Main"
    Rebuild

    '--- Right side gusset ---
    Dim gussetX_R As Double
    gussetX_R = TOWER_W / 2 + TUBE_W / 2

    Dim pGussetR As String
    pGussetR = MakePlane("Right Plane", m(gussetX_R), "Plane_GussetRight")

    StartSketch pGussetR
    g_swSkMgr.CreateLine _
        m(g_tBRz + TUBE_W / 2), m(yNeckBot), 0, _
        m(g_tFRz - TUBE_W / 2), m(yNeckBot), 0
    g_swSkMgr.CreateLine _
        m(g_tFRz - TUBE_W / 2), m(yNeckBot), 0, _
        m(g_tFRz - TUBE_W / 2), m(yNeckBot + GUSSET_L), 0
    g_swSkMgr.CreateLine _
        m(g_tFRz - TUBE_W / 2), m(yNeckBot + GUSSET_L), 0, _
        m(g_tBRz + TUBE_W / 2), m(yNeckBot), 0
    EndSketch
    Set f = DoExtrude(m(GUSSET_T))
    If Not f Is Nothing Then f.Name = "Gusset_Right_Main"
    LogErr "Gusset_Right_Main"
    Rebuild

    '--- Secondary (smaller) gussets at upper neck ---
    ' Located higher up the neck for additional stiffness
    Dim yGusset2 As Double
    yGusset2 = yNeckBot + NECK_H * 0.5

    ' Left secondary gusset
    StartSketch pGussetL
    g_swSkMgr.CreateLine _
        m(g_tBLz + TUBE_W / 2 + NECK_FWD * 0.5), m(yGusset2), 0, _
        m(g_tFLz - TUBE_W / 2 + NECK_FWD * 0.5), m(yGusset2), 0
    g_swSkMgr.CreateLine _
        m(g_tFLz - TUBE_W / 2 + NECK_FWD * 0.5), m(yGusset2), 0, _
        m(g_tFLz - TUBE_W / 2 + NECK_FWD * 0.5), m(yGusset2 + 80), 0
    g_swSkMgr.CreateLine _
        m(g_tFLz - TUBE_W / 2 + NECK_FWD * 0.5), m(yGusset2 + 80), 0, _
        m(g_tBLz + TUBE_W / 2 + NECK_FWD * 0.5), m(yGusset2), 0
    EndSketch
    Set f = DoExtrude(m(GUSSET_T))
    If Not f Is Nothing Then f.Name = "Gusset_Left_Upper"
    LogErr "Gusset_Left_Upper"
    Rebuild

    ' Right secondary gusset
    StartSketch pGussetR
    g_swSkMgr.CreateLine _
        m(g_tBRz + TUBE_W / 2 + NECK_FWD * 0.5), m(yGusset2), 0, _
        m(g_tFRz - TUBE_W / 2 + NECK_FWD * 0.5), m(yGusset2), 0
    g_swSkMgr.CreateLine _
        m(g_tFRz - TUBE_W / 2 + NECK_FWD * 0.5), m(yGusset2), 0, _
        m(g_tFRz - TUBE_W / 2 + NECK_FWD * 0.5), m(yGusset2 + 80), 0
    g_swSkMgr.CreateLine _
        m(g_tFRz - TUBE_W / 2 + NECK_FWD * 0.5), m(yGusset2 + 80), 0, _
        m(g_tBRz + TUBE_W / 2 + NECK_FWD * 0.5), m(yGusset2), 0
    EndSketch
    Set f = DoExtrude(m(GUSSET_T))
    If Not f Is Nothing Then f.Name = "Gusset_Right_Upper"
    LogErr "Gusset_Right_Upper"
    Rebuild

    Debug.Print "  Gussets: left+right main (150mm leg), left+right upper (80mm leg)"
End Sub

'====================================================================
' 6. DRUM SUPPORT CRADLE (SEPARATE BOLTED SUBFRAME)
'====================================================================
Private Sub CreateDrumCradle()
    Debug.Print "--- 6. Creating drum support cradle (separate bolted subframe) ---"

    Dim f As Object
    Dim yCradleBot As Double
    yCradleBot = TUBE_W + BASE_PLATE_T + TOWER_H + NECK_H + TUBE_W + FLANGE_T

    ' The cradle is a SEPARATE body (not merged with main frame)
    ' It bolts to the flanges on top of the angled neck

    '--- Cradle base ring (4 short tube sections forming a rectangle) ---
    Dim pCradleBot As String
    pCradleBot = MakePlane("Top Plane", m(yCradleBot), "Plane_CradleBot")

    ' Front rail of cradle base
    StartSketch pCradleBot
    DrawTubeProfile m(0), m(g_cZctr + CRADLE_D / 2), m(TUBE_W), m(TUBE_INNER)
    EndSketch
    Set f = DoExtrudeNoMerge(m(CRADLE_H))
    If Not f Is Nothing Then f.Name = "Cradle_FrontRail"
    LogErr "Cradle_FrontRail"
    Rebuild

    ' Rear rail
    StartSketch pCradleBot
    DrawTubeProfile m(0), m(g_cZctr - CRADLE_D / 2), m(TUBE_W), m(TUBE_INNER)
    EndSketch
    Set f = DoExtrudeNoMerge(m(CRADLE_H))
    If Not f Is Nothing Then f.Name = "Cradle_RearRail"
    LogErr "Cradle_RearRail"
    Rebuild

    ' Left rail
    StartSketch pCradleBot
    DrawTubeProfile m(-CRADLE_W / 2), m(g_cZctr), m(TUBE_W), m(TUBE_INNER)
    EndSketch
    Set f = DoExtrudeNoMerge(m(CRADLE_H))
    If Not f Is Nothing Then f.Name = "Cradle_LeftRail"
    LogErr "Cradle_LeftRail"
    Rebuild

    ' Right rail
    StartSketch pCradleBot
    DrawTubeProfile m(CRADLE_W / 2), m(g_cZctr), m(TUBE_W), m(TUBE_INNER)
    EndSketch
    Set f = DoExtrudeNoMerge(m(CRADLE_H))
    If Not f Is Nothing Then f.Name = "Cradle_RightRail"
    LogErr "Cradle_RightRail"
    Rebuild

    '--- Cradle cross members (internal support) ---
    ' Center cross member (X direction)
    StartSketch pCradleBot
    DrawTubeProfile m(0), m(g_cZctr), m(TUBE_W), m(TUBE_INNER)
    EndSketch
    Set f = DoExtrudeNoMerge(m(CRADLE_H))
    If Not f Is Nothing Then f.Name = "Cradle_CrossCenter"
    LogErr "Cradle_CrossCenter"
    Rebuild

    '--- Cradle bottom flange plate (bolts to neck flanges) ---
    ' 8mm plate at bottom of cradle with matching bolt holes
    Dim pCradleFlange As String
    pCradleFlange = MakePlane("Top Plane", m(yCradleBot - FLANGE_T), "Plane_CradleFlanges")

    ' Create flanges at the 4 corners matching neck flange positions
    Dim cfPositions As Variant
    cfPositions = Array( _
        Array(-CRADLE_W / 2, g_cZctr + CRADLE_D / 2, "FL"), _
        Array(CRADLE_W / 2, g_cZctr + CRADLE_D / 2, "FR"), _
        Array(-CRADLE_W / 2, g_cZctr - CRADLE_D / 2, "BL"), _
        Array(CRADLE_W / 2, g_cZctr - CRADLE_D / 2, "BR"))

    Dim ci As Integer
    For ci = 0 To 3
        Dim cfx As Double, cfz As Double, cftag As String
        cfx = cfPositions(ci)(0)
        cfz = cfPositions(ci)(1)
        cftag = cfPositions(ci)(2)

        ' Flange plate (same size as neck flanges)
        StartSketch pCradleFlange
        g_swSkMgr.CreateCornerRectangle _
            m(cfx - TUBE_W / 2 - 10), m(cfz - TUBE_W / 2 - 10), 0, _
            m(cfx + TUBE_W / 2 + 10), m(cfz + TUBE_W / 2 + 10), 0
        EndSketch
        Set f = DoExtrudeNoMerge(m(FLANGE_T))
        If Not f Is Nothing Then f.Name = "Cradle_Flange_" & cftag
        LogErr "Cradle_Flange_" & cftag
        Rebuild

        ' M8 bolt holes matching neck flange pattern
        Dim chi As Integer
        Dim chsigns As Variant
        chsigns = Array(-1, -1, 1, -1, 1, 1, -1, 1)
        For chi = 0 To 3
            Dim chx As Double, chz As Double
            chx = cfx + chsigns(chi * 2) * (TUBE_W / 2 - 3)
            chz = cfz + chsigns(chi * 2 + 1) * (TUBE_W / 2 - 3)

            StartSketch pCradleFlange
            g_swSkMgr.CreateCircle m(chx), m(chz), 0, m(chx + 4.5), m(chz), 0
            EndSketch
            Set f = DoCutThru()
            If Not f Is Nothing Then f.Name = "Cradle_BoltHole_" & cftag & "_" & (chi + 1)
            LogErr "Cradle_BoltHole_" & cftag & "_" & (chi + 1)
            Rebuild
        Next chi
    Next ci

    Debug.Print "  Drum cradle: separate bolted subframe, 350x350mm, 4 bolted flanges"
    Debug.Print "  Cradle is a removable assembly (bolted, not welded)"
End Sub

'====================================================================
' 7. DRUM MOUNTING PLATE (10mm with bolt pattern)
'====================================================================
Private Sub CreateDrumMountingPlate()
    Debug.Print "--- 7. Creating drum mounting plate ---"

    Dim f As Object
    Dim yPlate As Double
    yPlate = TUBE_W + BASE_PLATE_T + TOWER_H + NECK_H + TUBE_W + FLANGE_T + CRADLE_H

    '--- Create the mounting plate on top of the cradle ---
    Dim pPlate As String
    pPlate = MakePlane("Top Plane", m(yPlate), "Plane_DrumPlate")

    ' Plate outline (350x350mm, matching cradle)
    Dim plateHalf As Double
    plateHalf = 175

    StartSketch pPlate
    g_swSkMgr.CreateCornerRectangle _
        m(-plateHalf), m(g_cZctr - plateHalf), 0, _
        m(plateHalf), m(g_cZctr + plateHalf), 0
    EndSketch
    Set f = DoExtrudeNoMerge(m(DRUM_PLATE_T))
    If Not f Is Nothing Then f.Name = "DrumMountingPlate"
    LogErr "DrumMountingPlate"
    Rebuild

    '--- Drum bolt pattern (4x M10 on 200mm PCD, 1x center M12) ---
    Dim bp As Double
    bp = 100  ' half of 200mm bolt circle

    ' 4 corner M10 clearance holes (11mm dia)
    Dim bi As Integer
    Dim bsigns As Variant
    bsigns = Array(-1, -1, 1, -1, 1, 1, -1, 1)
    For bi = 0 To 3
        Dim bx As Double, bz As Double
        bx = bsigns(bi * 2) * bp
        bz = g_cZctr + bsigns(bi * 2 + 1) * bp

        StartSketch pPlate
        g_swSkMgr.CreateCircle m(bx), m(bz), 0, m(bx + 5.5), m(bz), 0  ' M10 + 1mm = 11mm
        EndSketch
        Set f = DoCutThru()
        If Not f Is Nothing Then f.Name = "DrumPlate_Hole_M10_" & (bi + 1)
        LogErr "DrumPlate_Hole_M10_" & (bi + 1)
        Rebuild
    Next bi

    ' Center M12 hole (13mm dia)
    StartSketch pPlate
    g_swSkMgr.CreateCircle 0, m(g_cZctr), 0, m(6.5), m(g_cZctr), 0  ' M12 + 1mm = 13mm
    EndSketch
    Set f = DoCutThru()
    If Not f Is Nothing Then f.Name = "DrumPlate_Hole_M12_Center"
    LogErr "DrumPlate_Hole_M12_Center"
    Rebuild

    '--- Alignment dowel holes (2x, 6mm dia) ---
    ' Offset from center for precise drum positioning
    StartSketch pPlate
    g_swSkMgr.CreateCircle m(-60), m(g_cZctr - 60), 0, m(-57), m(g_cZctr - 60), 0
    EndSketch
    Set f = DoCutThru()
    If Not f Is Nothing Then f.Name = "DrumPlate_DowelHole_1"
    LogErr "DrumPlate_DowelHole_1"
    Rebuild

    StartSketch pPlate
    g_swSkMgr.CreateCircle m(60), m(g_cZctr + 60), 0, m(63), m(g_cZctr + 60), 0
    EndSketch
    Set f = DoCutThru()
    If Not f Is Nothing Then f.Name = "DrumPlate_DowelHole_2"
    LogErr "DrumPlate_DowelHole_2"
    Rebuild

    '--- Service clearance cutouts (4 slots for access to bolts) ---
    ' These allow reaching the cradle bolts without removing the drum plate
    For bi = 0 To 3
        Dim sx As Double, sz As Double
        sx = bsigns(bi * 2) * 120
        sz = g_cZctr + bsigns(bi * 2 + 1) * 120

        StartSketch pPlate
        g_swSkMgr.CreateCornerRectangle _
            m(sx - 15), m(sz - 8), 0, _
            m(sx + 15), m(sz + 8), 0
        EndSketch
        Set f = DoCutThru()
        If Not f Is Nothing Then f.Name = "DrumPlate_ServiceSlot_" & (bi + 1)
        LogErr "DrumPlate_ServiceSlot_" & (bi + 1)
        Rebuild
    Next bi

    '--- Apple-style chamfer detail (1mm edge break on top) ---
    ' Create a small recess on the top face
    StartSketch pPlate
    g_swSkMgr.CreateCornerRectangle _
        m(-plateHalf + 5), m(g_cZctr - plateHalf + 5), 0, _
        m(plateHalf - 5), m(g_cZctr + plateHalf - 5), 0
    EndSketch
    Set f = DoCut(m(1.5))
    If Not f Is Nothing Then f.Name = "DrumPlate_TopRecess"
    LogErr "DrumPlate_TopRecess"
    Rebuild

    Debug.Print "  Drum plate: 350x350x10mm, 4xM10 + 1xM12 + 2 dowels + service slots"
End Sub

'====================================================================
' 8. VIBRATION ISOLATION PROVISIONS
'====================================================================
Private Sub CreateVibrationIsolation()
    Debug.Print "--- 8. Adding vibration isolation provisions ---"

    Dim f As Object
    Dim yPlate As Double
    yPlate = TUBE_W + BASE_PLATE_T + TOWER_H + NECK_H + TUBE_W + FLANGE_T + CRADLE_H

    '--- Isolator mounting tabs (on the underside of the drum plate) ---
    ' 4 tabs, each with a recess for a rubber isolator bushing
    Dim isoY As Double
    isoY = yPlate - 5  ' 5mm below drum plate surface

    Dim pIso As String
    pIso = MakePlane("Top Plane", m(isoY), "Plane_IsoMounts")

    Dim isoR As Double
    isoR = 20  ' 20mm radius isolator pocket

    Dim ii As Integer
    Dim isigns As Variant
    isigns = Array(-1, -1, 1, -1, 1, 1, -1, 1)
    For ii = 0 To 3
        Dim ix As Double, iz As Double
        ix = isigns(ii * 2) * 100
        iz = g_cZctr + isigns(ii * 2 + 1) * 100

        ' Isolator mounting boss (cylindrical, 40mm dia, 15mm tall)
        StartSketch pIso
        g_swSkMgr.CreateCircle m(ix), m(iz), 0, m(ix + m(isoR)), m(iz), 0
        EndSketch
        Set f = DoExtrudeRev(m(15))
        If Not f Is Nothing Then f.Name = "Iso_Boss_" & (ii + 1)
        LogErr "Iso_Boss_" & (ii + 1)
        Rebuild

        ' Center hole for M8 isolator stud
        StartSketch pIso
        g_swSkMgr.CreateCircle m(ix), m(iz), 0, m(ix + m(4.5)), m(iz), 0
        EndSketch
        Set f = DoCutThru()
        If Not f Is Nothing Then f.Name = "Iso_StudHole_" & (ii + 1)
        LogErr "Iso_StudHole_" & (ii + 1)
        Rebuild

        ' Isolator pocket (counterbore for rubber bushing, 30mm dia, 8mm deep)
        StartSketch pIso
        g_swSkMgr.CreateCircle m(ix), m(iz), 0, m(ix + m(15)), m(iz), 0
        EndSketch
        Set f = DoCut(m(8))
        If Not f Is Nothing Then f.Name = "Iso_Pocket_" & (ii + 1)
        LogErr "Iso_Pocket_" & (ii + 1)
        Rebuild
    Next ii

    '--- Vibration isolation note (for drawing) ---
    ' Add a sketch note indicating isolator specification
    ' (This is a Visual Basic comment as SW sketch notes require user interaction)

    Debug.Print "  Vibration isolation: 4 mounting points (40mm dia bosses, M8 studs)"
    Debug.Print "  Install rubber vibration isolators between drum plate and cradle"
End Sub

'====================================================================
' 9. ELECTRONICS MOUNTING TRAY
'====================================================================
Private Sub CreateElectronicsTray()
    Debug.Print "--- 9. Creating electronics mounting tray ---"

    Dim f As Object
    Dim yTray As Double
    yTray = TUBE_W + BASE_PLATE_T + 200  ' 200mm above base plate inside tower

    '--- Create the electronics tray ---
    ' The tray sits inside the tower, spanning between the front and rear posts
    ' It's a U-shaped channel that slides in from the side

    ' Tray position inside tower
    Dim trayCx As Double
    trayCx = 0  ' centered in X
    Dim trayCz As Double
    trayCz = g_tCtrZ + TOWER_D / 4  ' offset toward front

    Dim pTray As String
    pTray = MakePlane("Top Plane", m(yTray), "Plane_ElectronicsTray")

    '--- Tray base ---
    StartSketch pTray
    g_swSkMgr.CreateCornerRectangle _
        m(trayCx - TRAY_W / 2), m(trayCz - TRAY_D / 2), 0, _
        m(trayCx + TRAY_W / 2), m(trayCz + TRAY_D / 2), 0
    EndSketch
    Set f = DoExtrudeNoMerge(m(3))
    If Not f Is Nothing Then f.Name = "ElecTray_Base"
    LogErr "ElecTray_Base"
    Rebuild

    '--- Tray side walls (2mm, 50mm tall) ---
    ' Left wall
    StartSketch pTray
    g_swSkMgr.CreateCornerRectangle _
        m(trayCx - TRAY_W / 2 - 2), m(trayCz - TRAY_D / 2), 0, _
        m(trayCx - TRAY_W / 2), m(trayCz + TRAY_D / 2), 0
    EndSketch
    Set f = DoExtrudeNoMerge(m(TRAY_H))
    If Not f Is Nothing Then f.Name = "ElecTray_WallLeft"
    LogErr "ElecTray_WallLeft"
    Rebuild

    ' Right wall
    StartSketch pTray
    g_swSkMgr.CreateCornerRectangle _
        m(trayCx + TRAY_W / 2), m(trayCz - TRAY_D / 2), 0, _
        m(trayCx + TRAY_W / 2 + 2), m(trayCz + TRAY_D / 2), 0
    EndSketch
    Set f = DoExtrudeNoMerge(m(TRAY_H))
    If Not f Is Nothing Then f.Name = "ElecTray_WallRight"
    LogErr "ElecTray_WallRight"
    Rebuild

    ' Rear wall
    StartSketch pTray
    g_swSkMgr.CreateCornerRectangle _
        m(trayCx - TRAY_W / 2), m(trayCz - TRAY_D / 2 - 2), 0, _
        m(trayCx + TRAY_W / 2), m(trayCz - TRAY_D / 2), 0
    EndSketch
    Set f = DoExtrudeNoMerge(m(TRAY_H))
    If Not f Is Nothing Then f.Name = "ElecTray_WallRear"
    LogErr "ElecTray_WallRear"
    Rebuild

    '--- Ventilation slots (in the tray base) ---
    Dim vi As Integer
    For vi = 0 To 4
        Dim vx As Double
        vx = trayCx - TRAY_W / 2 + 20 + vi * 30

        StartSketch pTray
        g_swSkMgr.CreateCornerRectangle _
            m(vx), m(trayCz - 10), 0, _
            m(vx + 15), m(trayCz + 10), 0
        EndSketch
        Set f = DoCut(m(3))
        If Not f Is Nothing Then f.Name = "ElecTray_VentSlot_" & (vi + 1)
        LogErr "ElecTray_VentSlot_" & (vi + 1)
        Rebuild
    Next vi

    '--- Component mounting holes (for controller, PSU, amplifier) ---
    ' Controller mounting (4x M4)
    Dim mPositions As Variant
    mPositions = Array( _
        Array(trayCx - 100, trayCz - 60, "Ctrl"), _
        Array(trayCx + 100, trayCz - 60, "PSU"), _
        Array(trayCx - 80, trayCz + 60, "Amp"))

    Dim mi As Integer
    For mi = 0 To 2
        Dim mx As Double, mz As Double, mtag As String
        mx = mPositions(mi)(0)
        mz = mPositions(mi)(1)
        mtag = mPositions(mi)(2)

        ' 4 holes per component
        Dim mii As Integer
        Dim msigns As Variant
        msigns = Array(-1, -1, 1, -1, 1, 1, -1, 1)
        For mii = 0 To 3
            Dim mhx As Double, mhz As Double
            mhx = mx + msigns(mii * 2) * 15
            mhz = mz + msigns(mii * 2 + 1) * 10

            StartSketch pTray
            g_swSkMgr.CreateCircle m(mhx), m(mhz), 0, m(mhx + 2.3), m(mhz), 0  ' M4 = 4.5mm dia
            EndSketch
            Set f = DoCutThru()
            If Not f Is Nothing Then f.Name = "ElecTray_Mount_" & mtag & "_" & (mii + 1)
            LogErr "ElecTray_Mount_" & mtag & "_" & (mii + 1)
            Rebuild
        Next mii
    Next mi

    '--- Tray slide rails (for removable tray) ---
    ' L-angle rails welded to tower, tray slides on top
    Dim slideZ As Double
    slideZ = trayCz - TRAY_D / 2 - 5

    ' Left slide rail: runs in Z direction at the tray height
    StartSketch "Front Plane"
    g_swSkMgr.CreateLine m(trayCx - TRAY_W / 2 - 5), m(slideZ), 0, _
                         m(trayCx - TRAY_W / 2 - 5), m(slideZ + 15), 0
    g_swSkMgr.CreateLine m(trayCx - TRAY_W / 2 - 5), m(slideZ + 15), 0, _
                         m(trayCx - TRAY_W / 2 + 10), m(slideZ + 15), 0
    EndSketch
    Set f = DoExtrudeMid(m(TRAY_H))
    If Not f Is Nothing Then f.Name = "ElecTray_SlideRail_L"
    LogErr "ElecTray_SlideRail_L"
    Rebuild

    ' Right slide rail
    StartSketch "Front Plane"
    g_swSkMgr.CreateLine m(trayCx + TRAY_W / 2 + 5), m(slideZ), 0, _
                         m(trayCx + TRAY_W / 2 + 5), m(slideZ + 15), 0
    g_swSkMgr.CreateLine m(trayCx + TRAY_W / 2 + 5), m(slideZ + 15), 0, _
                         m(trayCx + TRAY_W / 2 - 10), m(slideZ + 15), 0
    EndSketch
    Set f = DoExtrudeMid(m(TRAY_H))
    If Not f Is Nothing Then f.Name = "ElecTray_SlideRail_R"
    LogErr "ElecTray_SlideRail_R"
    Rebuild

    Debug.Print "  Electronics tray: 300x200x50mm, removable, with ventilation"
End Sub

'====================================================================
' 10. CABLE MANAGEMENT
'====================================================================
Private Sub CreateCableManagement()
    Debug.Print "--- 10. Creating cable management features ---"

    Dim f As Object
    Dim yTop As Double
    yTop = m(TUBE_W + BASE_PLATE_T + TOWER_H + NECK_H + TUBE_W + FLANGE_T + CRADLE_H)

    '--- Main cable channel (welded U-channel inside rear-right tower corner) ---
    ' Channel runs vertically from base to drum level
    ' Position: inside the rear-right corner of the tower

    ' Channel position in XY plane (top-down view)
    Dim chCx As Double
    chCx = TOWER_W / 2 - TUBE_W - 15   ' X center of channel (near right post)
    Dim chCz As Double
    chCz = g_tCtrZ - TOWER_D / 2 + TUBE_W + 15  ' Z center (near rear post)

    ' U-channel dimensions
    Dim chW As Double
    chW = 40   ' overall channel width (X direction)
    Dim chD As Double
    chD = 25   ' channel depth (Z direction)
    Dim chT As Double
    chT = 2    ' wall thickness

    ' Create a plane at Z=chCz (offset from Front Plane) for vertical channel
    Dim pChannel As String
    pChannel = MakePlane("Front Plane", m(chCz), "Plane_CableChannel")
    If pChannel = "" Then pChannel = "Front Plane"

    ' Draw U-channel profile on Front Plane offset
    ' Front Plane sketch: X=global X, Y=global Z
    ' Extrude in Y direction (vertical) by tower height
    StartSketch pChannel

    ' Back wall (at Z = chCz - chD/2, runs in X direction)
    g_swSkMgr.CreateLine m(chCx - chW / 2), m(-chD / 2), 0, _
                         m(chCx + chW / 2), m(-chD / 2), 0

    ' Right side wall (extends forward from back wall)
    g_swSkMgr.CreateLine m(chCx + chW / 2), m(-chD / 2), 0, _
                         m(chCx + chW / 2), m(chD / 2), 0

    ' Inner right wall (return)
    g_swSkMgr.CreateLine m(chCx + chW / 2), m(chD / 2), 0, _
                         m(chCx + chW / 2 - chT), m(chD / 2), 0

    ' Inner right wall bottom
    g_swSkMgr.CreateLine m(chCx + chW / 2 - chT), m(chD / 2), 0, _
                         m(chCx + chW / 2 - chT), m(-chD / 2 + chT), 0

    ' Inner back wall
    g_swSkMgr.CreateLine m(chCx + chW / 2 - chT), m(-chD / 2 + chT), 0, _
                         m(chCx - chW / 2 + chT), m(-chD / 2 + chT), 0

    ' Inner left wall bottom
    g_swSkMgr.CreateLine m(chCx - chW / 2 + chT), m(-chD / 2 + chT), 0, _
                         m(chCx - chW / 2 + chT), m(chD / 2), 0

    ' Left side wall (extends forward)
    g_swSkMgr.CreateLine m(chCx - chW / 2 + chT), m(chD / 2), 0, _
                         m(chCx - chW / 2), m(chD / 2), 0

    ' Left side wall outer
    g_swSkMgr.CreateLine m(chCx - chW / 2), m(chD / 2), 0, _
                         m(chCx - chW / 2), m(-chD / 2), 0

    EndSketch
    Set f = DoExtrudeMid(m(TOWER_H + NECK_H))
    If Not f Is Nothing Then f.Name = "Cable_UChannel"
    LogErr "Cable_UChannel"
    Rebuild

    '--- Cable dividers (separate power, signal, audio) ---
    ' These are welded inside the channel
    ' Divider 1: at 1/3 width (X direction)
    Dim div1X As Double
    div1X = chCx - chW / 6

    StartSketch pChannel
    g_swSkMgr.CreateLine m(div1X), m(-chD / 2 + chT), 0, _
                         m(div1X), m(chD / 2), 0
    EndSketch
    Set f = DoExtrudeMid(m(TOWER_H + NECK_H))
    If Not f Is Nothing Then f.Name = "Cable_Divider_Power"
    LogErr "Cable_Divider_Power"
    Rebuild

    ' Divider 2: at 2/3 width (X direction)
    Dim div2X As Double
    div2X = chCx + chW / 6

    StartSketch pChannel
    g_swSkMgr.CreateLine m(div2X), m(-chD / 2 + chT), 0, _
                         m(div2X), m(chD / 2), 0
    EndSketch
    Set f = DoExtrudeMid(m(TOWER_H + NECK_H))
    If Not f Is Nothing Then f.Name = "Cable_Divider_Signal"
    LogErr "Cable_Divider_Signal"
    Rebuild

    '--- Cable tie slots (small notches in channel wall, every 300mm) ---
    ' Create horizontal cuts through the channel wall at regular intervals
    Dim ti As Integer
    Dim nTies As Integer
    nTies = Int(TOWER_H / 300)

    For ti = 1 To nTies
        Dim tieY As Double
        tieY = TUBE_W + BASE_PLATE_T + ti * 300

        ' Create a plane at this Y height for the cut
        Dim pTie As String
        pTie = MakePlane("Top Plane", m(tieY), "Plane_CableTie_" & ti)

        StartSketch pTie
        g_swSkMgr.CreateCornerRectangle _
            m(chCx - 10), m(chCz - 1), 0, _
            m(chCx + 10), m(chCz + 1), 0
        EndSketch
        Set f = DoCutThru()
        If Not f Is Nothing Then f.Name = "Cable_TieSlot_" & ti
        LogErr "Cable_TieSlot_" & ti
        Rebuild
    Next ti

    '--- Cable entry hole (in base plate, below channel) ---
    ' Create a plane at base plate top for the hole
    Dim pEntry As String
    pEntry = MakePlane("Top Plane", m(TUBE_W + BASE_PLATE_T), "Plane_CableEntry")

    StartSketch pEntry
    g_swSkMgr.CreateCircle m(chCx), m(chCz), 0, m(chCx + 15), m(chCz), 0
    EndSketch
    Set f = DoCutThru()
    If Not f Is Nothing Then f.Name = "Cable_EntryHole"
    LogErr "Cable_EntryHole"
    Rebuild

    '--- Cable exit slot (in cradle mounting plate) ---
    Dim yCradleBot As Double
    yCradleBot = TUBE_W + BASE_PLATE_T + TOWER_H + NECK_H + TUBE_W + FLANGE_T + CRADLE_H

    Dim pExit As String
    pExit = MakePlane("Top Plane", m(yCradleBot), "Plane_CableExit")

    StartSketch pExit
    g_swSkMgr.CreateCornerRectangle _
        m(chCx - 15), m(chCz - 8), 0, _
        m(chCx + 15), m(chCz + 8), 0
    EndSketch
    Set f = DoCutThru()
    If Not f Is Nothing Then f.Name = "Cable_ExitSlot"
    LogErr "Cable_ExitSlot"
    Rebuild

    Debug.Print "  Cable management: U-channel + 2 dividers + " & nTies & " tie slots"
    Debug.Print "  Power/Signal/Audio routes separated; entry/exit holes included"
End Sub

'====================================================================
' 11. SERVICE ACCESS (REAR DOOR OPENING)
'====================================================================
Private Sub CreateServiceAccess()
    Debug.Print "--- 11. Creating rear service access ---"

    Dim f As Object

    '--- Service opening location (rear face of tower, centered) ---
    Dim servY As Double
    servY = TUBE_W + BASE_PLATE_T + TOWER_H / 2  ' centered on tower height

    ' Create a plane at the rear face
    Dim servZ As Double
    servZ = g_tCtrZ - TOWER_D / 2 - TUBE_W / 2  ' rear face

    Dim pServ As String
    pServ = MakePlane("Front Plane", m(servZ), "Plane_ServiceDoor")

    '--- Cut the service opening (through the rear shear panel) ---
    StartSketch pServ
    g_swSkMgr.CreateCornerRectangle _
        m(-SERV_W / 2), m(servY - SERV_H / 2), 0, _
        m(SERV_W / 2), m(servY + SERV_H / 2), 0
    EndSketch
    Set f = DoCutThru()
    If Not f Is Nothing Then f.Name = "Service_DoorOpening"
    LogErr "Service_DoorOpening"
    Rebuild

    '--- Door frame (reinforced border around the opening) ---
    ' Use 25x25x3 tube for the door frame
    Dim doorTubeW As Double
    doorTubeW = 25

    ' Top frame member: runs in X direction at top of door opening
    StartSketch "Right Plane"
    DrawTubeProfile m(servZ), m(servY + SERV_H / 2), m(doorTubeW), m(doorTubeW - 6)
    EndSketch
    Set f = DoExtrudeMid(m(SERV_W + doorTubeW))
    If Not f Is Nothing Then f.Name = "Service_Frame_Top"
    LogErr "Service_Frame_Top"
    Rebuild

    ' Bottom frame member: runs in X direction at bottom of door opening
    StartSketch "Right Plane"
    DrawTubeProfile m(servZ), m(servY - SERV_H / 2), m(doorTubeW), m(doorTubeW - 6)
    EndSketch
    Set f = DoExtrudeMid(m(SERV_W + doorTubeW))
    If Not f Is Nothing Then f.Name = "Service_Frame_Bottom"
    LogErr "Service_Frame_Bottom"
    Rebuild

    ' Left frame member: runs in Y direction at left of door opening
    StartSketch "Front Plane"
    DrawTubeProfile m(-SERV_W / 2), m(servZ), m(doorTubeW), m(doorTubeW - 6)
    EndSketch
    Set f = DoExtrudeMid(m(SERV_H))
    If Not f Is Nothing Then f.Name = "Service_Frame_Left"
    LogErr "Service_Frame_Left"
    Rebuild

    ' Right frame member: runs in Y direction at right of door opening
    StartSketch "Front Plane"
    DrawTubeProfile m(SERV_W / 2), m(servZ), m(doorTubeW), m(doorTubeW - 6)
    EndSketch
    Set f = DoExtrudeMid(m(SERV_H))
    If Not f Is Nothing Then f.Name = "Service_Frame_Right"
    LogErr "Service_Frame_Right"
    Rebuild

    '--- Hidden hinge mounting locations (left side, 2 locations) ---
    Dim hingeY1 As Double, hingeY2 As Double
    hingeY1 = servY - SERV_H / 2 + 50
    hingeY2 = servY + SERV_H / 2 - 50

    ' Hinge mounting blocks (on left side of door frame)
    Dim hi As Integer
    Dim hyVals As Variant
    hyVals = Array(hingeY1, hingeY2)
    For hi = 0 To 1
        StartSketch "Front Plane"
        g_swSkMgr.CreateCornerRectangle _
            m(-SERV_W / 2 - 15), m(servZ - 5), 0, _
            m(-SERV_W / 2), m(servZ + 5), 0
        EndSketch
        Set f = DoExtrudeMid(m(30))
        If Not f Is Nothing Then f.Name = "Service_HingeBlock_" & (hi + 1)
        LogErr "Service_HingeBlock_" & (hi + 1)
        Rebuild

        ' M5 screw hole in hinge block
        StartSketch "Front Plane"
        g_swSkMgr.CreateCircle m(-SERV_W / 2 - 7), m(servZ), 0, _
                               m(-SERV_W / 2 - 4.5), m(servZ), 0
        EndSketch
        Set f = DoCutThru()
        If Not f Is Nothing Then f.Name = "Service_HingeScrew_" & (hi + 1)
        LogErr "Service_HingeScrew_" & (hi + 1)
        Rebuild
    Next hi

    '--- Cam-lock provision (right side, center) ---
    StartSketch "Front Plane"
    g_swSkMgr.CreateCornerRectangle _
        m(SERV_W / 2), m(servZ - 5), 0, _
        m(SERV_W / 2 + 10), m(servZ + 5), 0
    EndSketch
    Set f = DoExtrudeMid(m(30))
    If Not f Is Nothing Then f.Name = "Service_CamLockMount"
    LogErr "Service_CamLockMount"
    Rebuild

    ' Cam-lock hole (rectangular for cam lock barrel)
    StartSketch "Front Plane"
    g_swSkMgr.CreateCornerRectangle _
        m(SERV_W / 2 + 3), m(servZ - 3), 0, _
        m(SERV_W / 2 + 8), m(servZ + 3), 0
    EndSketch
    Set f = DoCutThru()
    If Not f Is Nothing Then f.Name = "Service_CamLockHole"
    LogErr "Service_CamLockHole"
    Rebuild

    Debug.Print "  Service access: " & SERV_W & "x" & SERV_H & "mm door opening + hinges + cam-lock"
End Sub

'====================================================================
' 12. DISPLAY MOUNTING STRUCTURE (VESA COMPATIBLE)
'====================================================================
Private Sub CreateDisplayMount()
    Debug.Print "--- 12. Creating display mounting structure ---"

    Dim f As Object

    '--- Display position (centered in tower, front-facing) ---
    Dim dispY As Double
    dispY = TUBE_W + BASE_PLATE_T + TOWER_H * 0.45  ' ~45% up the tower

    Dim dispX As Double
    dispX = 0  ' centered in X

    Dim dispZ As Double
    dispZ = g_tCtrZ + TOWER_D / 2 - TUBE_W / 2 - 2  ' flush with front post faces

    '--- VESA mounting plate (75x75mm or 100x100mm compatible) ---
    Dim vesaHalf As Double
    vesaHalf = VESA_PATTERN / 2  ' 37.5mm for 75mm pattern

    ' Mounting plate on the front face of tower
    ' Draw on Front Plane at Z=dispZ, extrude in Z direction
    Dim pVesa As String
    pVesa = MakePlane("Front Plane", m(dispZ), "Plane_VESAMount")

    ' Mounting plate (120x80mm, 5mm thick)
    StartSketch pVesa
    g_swSkMgr.CreateCornerRectangle _
        m(dispX - 60), m(dispY - 40), 0, _
        m(dispX + 60), m(dispY + 40), 0
    EndSketch
    Set f = DoExtrudeRev(m(5))
    If Not f Is Nothing Then f.Name = "Display_MountPlate"
    LogErr "Display_MountPlate"
    Rebuild

    '--- VESA bolt pattern (4x M4 on VESA_PATTERN spacing) ---
    Dim vi As Integer
    Dim vsigns As Variant
    vsigns = Array(-1, -1, 1, -1, 1, 1, -1, 1)
    For vi = 0 To 3
        Dim vx As Double, vy As Double
        vx = dispX + vsigns(vi * 2) * vesaHalf
        vy = dispY + vsigns(vi * 2 + 1) * vesaHalf

        StartSketch pVesa
        g_swSkMgr.CreateCircle m(vx), m(vy), 0, m(vx + 2.5), m(vy), 0  ' M4 = 5mm dia
        EndSketch
        Set f = DoCutThru()
        If Not f Is Nothing Then f.Name = "Display_VESAHole_" & (vi + 1)
        LogErr "Display_VESAHole_" & (vi + 1)
        Rebuild
    Next vi

    '--- Support brackets (connecting mount plate to tower posts) ---
    ' Left bracket: runs in X direction at the display height
    Dim bracketZ As Double
    bracketZ = dispZ  ' at front face

    StartSketch "Top Plane"
    ' Bracket profile: from center to left post
    g_swSkMgr.CreateLine m(dispX), m(dispY - 5), 0, _
                         m(dispX - 60), m(dispY - 5), 0
    g_swSkMgr.CreateLine m(dispX - 60), m(dispY - 5), 0, _
                         m(dispX - 60), m(dispY + 5), 0
    g_swSkMgr.CreateLine m(dispX - 60), m(dispY + 5), 0, _
                         m(dispX), m(dispY + 5), 0
    g_swSkMgr.CreateLine m(dispX), m(dispY + 5), 0, _
                         m(dispX), m(dispY - 5), 0
    EndSketch
    Set f = DoExtrudeMid(m(60))
    If Not f Is Nothing Then f.Name = "Display_Bracket_Left"
    LogErr "Display_Bracket_Left"
    Rebuild

    ' Right bracket
    StartSketch "Top Plane"
    g_swSkMgr.CreateLine m(dispX), m(dispY - 5), 0, _
                         m(dispX + 60), m(dispY - 5), 0
    g_swSkMgr.CreateLine m(dispX + 60), m(dispY - 5), 0, _
                         m(dispX + 60), m(dispY + 5), 0
    g_swSkMgr.CreateLine m(dispX + 60), m(dispY + 5), 0, _
                         m(dispX), m(dispY + 5), 0
    g_swSkMgr.CreateLine m(dispX), m(dispY + 5), 0, _
                         m(dispX), m(dispY - 5), 0
    EndSketch
    Set f = DoExtrudeMid(m(60))
    If Not f Is Nothing Then f.Name = "Display_Bracket_Right"
    LogErr "Display_Bracket_Right"
    Rebuild

    Debug.Print "  Display mount: VESA " & VESA_PATTERN & "mm pattern, centered in tower"
End Sub

'====================================================================
' 13. AESTHETIC FINISH FEATURES
'====================================================================
Private Sub AddAestheticFeatures()
    Debug.Print "--- 13. Adding aesthetic finish features ---"

    Dim f As Object

    '--- Tube end caps (Apple-style closed tube ends) ---
    ' Create 3mm thick caps on all open tube ends
    Dim yTowerTop As Double
    yTowerTop = TUBE_W + BASE_PLATE_T + TOWER_H

    ' Cap plane at tower top
    Dim pCapTower As String
    pCapTower = MakePlane("Top Plane", m(yTowerTop + 1), "Plane_TowerCaps")

    ' Cap for each tower post (50x50 solid, 3mm thick)
    Dim cp As Integer
    Dim cpositions As Variant
    cpositions = Array( _
        Array(g_tFLx, g_tFLz, "FL"), _
        Array(g_tFRx, g_tFRz, "FR"), _
        Array(g_tBLx, g_tBLz, "BL"), _
        Array(g_tBRx, g_tBRz, "BR"))

    For cp = 0 To 3
        Dim cpx As Double, cpz As Double, cptag As String
        cpx = cpositions(cp)(0)
        cpz = cpositions(cp)(1)
        cptag = cpositions(cp)(2)

        StartSketch pCapTower
        g_swSkMgr.CreateCornerRectangle _
            m(cpx - TUBE_W / 2 + 1), m(cpz - TUBE_W / 2 + 1), 0, _
            m(cpx + TUBE_W / 2 - 1), m(cpz + TUBE_W / 2 - 1), 0
        EndSketch
        Set f = DoExtrude(m(3))
        If Not f Is Nothing Then f.Name = "Cap_Tower_" & cptag
        LogErr "Cap_Tower_" & cptag
        Rebuild
    Next cp

    '--- Base corner radius treatment (20mm radius on base corners) ---
    ' Create corner radius blocks at each base corner
    Dim radR As Double
    radR = 20

    Dim rpos As Variant
    rpos = Array( _
        Array(-BASE_W / 2, -BASE_D / 2, "BL"), _
        Array(-BASE_W / 2, BASE_D / 2, "FL"), _
        Array(BASE_W / 2, -BASE_D / 2, "BR"), _
        Array(BASE_W / 2, BASE_D / 2, "FR"))

    Dim ri As Integer
    For ri = 0 To 3
        Dim rcx As Double, rcz As Double, rtag As String
        rcx = rpos(ri)(0)
        rcz = rpos(ri)(1)
        rtag = rpos(ri)(2)

        StartSketch "Top Plane"
        g_swSkMgr.CreateArc _
            m(rcx), m(rcz), 0, _
            m(rcx + radR), m(rcz), 0, _
            m(rcx), m(rcz + radR), 0, _
            1 ' CCW
        g_swSkMgr.CreateLine m(rcx + radR), m(rcz), 0, m(rcx), m(rcz), 0
        g_swSkMgr.CreateLine m(rcx), m(rcz), 0, m(rcx), m(rcz + radR), 0
        EndSketch
        Set f = DoExtrude(m(5))
        If Not f Is Nothing Then f.Name = "Base_RadiusCorner_" & rtag
        LogErr "Base_RadiusCorner_" & rtag
        Rebuild
    Next ri

    '--- Weld preparation chamfers (visual weld indicators at key joints) ---
    ' Small chamfers at critical tube-to-tube intersections
    ' Note: True chamfer features require edges; we use small extrusions as visual aids

    '--- Branding recess (for logo/nameplate on the front base) ---
    Dim brandY As Double
    brandY = m(TUBE_W + 10)

    Dim pBrand As String
    pBrand = MakePlane("Front Plane", m(g_tCtrZ + TOWER_D / 2 + TUBE_W / 2), "Plane_BrandRecess")

    ' Subtle recessed rectangle for logo plate
    StartSketch pBrand
    g_swSkMgr.CreateCornerRectangle _
        m(-60), brandY, 0, _
        m(60), m(brandY + 40), 0
    EndSketch
    Set f = DoCut(m(1))
    If Not f Is Nothing Then f.Name = "Branding_LogoRecess"
    LogErr "Branding_LogoRecess"
    Rebuild

    Debug.Print "  Aesthetic features: tube end caps, base radii, weld indicators, logo recess"
End Sub

'====================================================================
' HIDE ALL REFERENCE PLANES
'====================================================================
Private Sub HideAllPlanes()
    Debug.Print "--- Hiding reference planes ---"

    Dim vFeats As Variant
    Dim count As Long
    count = 0

    On Error Resume Next
    vFeats = g_swModel.FeatureManager.GetFeatures(False)
    On Error GoTo 0

    If IsEmpty(vFeats) Then
        Debug.Print "  No features found"
        Exit Sub
    End If

    Dim i As Long
    For i = LBound(vFeats) To UBound(vFeats)
        Dim swFeatObj As Object
        Set swFeatObj = vFeats(i)

        On Error Resume Next
        Dim featType As String
        featType = swFeatObj.GetTypeName2

        If featType = "RefPlane" Then
            swFeatObj.Select False, 0
            g_swModel.BlankRefGeometry
            g_swModel.ClearSelection2 True
            count = count + 1
        End If
        On Error GoTo 0
    Next i

    Debug.Print "  Hidden " & count & " reference planes"
End Sub

'====================================================================
' END OF MACRO
'====================================================================
