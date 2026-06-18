'====================================================================
' DRUM KIOSK FRAME - STRUCTURAL IMPROVEMENT MACRO
' Target: SolidWorks 2026 (API 32.x)
' Builds upon the existing KioskVitalsKiosk weldment frame
'
' Improvements applied:
'   1. Triangular gussets (6mm) at angled neck transition (both sides)
'   2. Top drum support cross members + secondary horizontal support
'   3. Rear shear structure (hidden diagonal members) for torsional rigidity
'   4. Extended base footprint (forward + rearward) for anti-tip
'   5. 10mm steel drum mounting plate with central hole pattern
'   6. Vibration isolation bushing mounting points (4 corners)
'   7. Cable management tabs and internal routing path
'   8. Rear service opening frame for removable service panel
'   9. Mitered, manufacturable tube construction (40x40x3 SHS)
'  10. Apple/Tesla industrial design language - clean, proportional
'
' SW 2026 API NOTES:
'   - FeatureExtrusion3: 23 params (includes AssemblyFeatureScope block)
'   - FeatureCut4: 27 params (includes Scope + AutoSelectInvert block)
'   - InsertRefPlane(8,...) = swRefPlaneReferenceConstraint_Distance
'   - All dimension constants in mm; converted to meters via m() function
'
' HOW TO RUN:
'   1. Open the existing frame weldment in SolidWorks 2026
'   2. Tools > Macro > Edit (VBA Editor)
'   3. File > Import File > select this .bas file
'   4. In VBA Editor > Tools > References > check
'        "SldWorks 2026 Type Library"
'   5. F5 > ImproveDrumKioskFrame
'====================================================================
Option Explicit

'--- Application References (early binding - SW 2026 type lib) ---
Dim g_swApp          As SldWorks.SldWorks
Dim g_swModel        As SldWorks.ModelDoc2
Dim g_swPart         As SldWorks.PartDoc
Dim g_swSkMgr        As SldWorks.SketchManager
Dim g_swFeatMgr      As SldWorks.FeatureManager
Dim g_swSelMgr       As SldWorks.SelectionMgr

'--- Unit conversion (mm -> meters, internal SW unit) ---
Const MM As Double = 0.001

'====================================================================
' FRAME DIMENSIONS  (mm)  - must match the existing frame
'====================================================================
Const TW      As Double = 500      ' tower width
Const TD      As Double = 400      ' tower depth
Const TH      As Double = 1600     ' tower height
Const FS      As Double = 40       ' frame size (square tube)
Const FW      As Double = 3        ' frame wall thickness
Const PT      As Double = 8        ' panel thickness
Const FS2     As Double = 30       ' secondary tubing size (30x30x3)
Const FS3     As Double = 25       ' light cross-brace tubing (25x25x3)
Const NECK_H  As Double = 300      ' angled neck transition height
Const NECK_TOP_W As Double = 280   ' top frame width at neck
Const NECK_TOP_D As Double = 280   ' top frame depth at neck
Const DRUM_D  As Double = 380      ' drum diameter
Const DRUM_OFFSET As Double = 80   ' drum center offset forward from tower center

'--- Derived absolute positions (meters) ---
Dim g_yBot As Double, g_yMid As Double, g_yNeckBot As Double
Dim g_yNeckTop As Double, g_yTop As Double
Dim g_xLeft As Double, g_xRight As Double, g_xCtr As Double
Dim g_zFront As Double, g_zRear As Double, g_zCtr As Double

'--- Profile library (SW 2026 standard structural shapes) ---
Const TUBE_LIB As String = "C:\ProgramData\SolidWorks\SOLIDWORKS 2026\lang\english\sldweld\Square tube.SLDLFP"
Const TUBE_40  As String = "40 x 40 x 3"
Const TUBE_30  As String = "30 x 30 x 3"
Const TUBE_25  As String = "25 x 25 x 3"
Const TUBE_20  As String = "20 x 20 x 3"

'--- Path to existing frame part ---
Const FRAME_PATH As String = "C:\Users\kisha\Documents\Kiosk\KioskFrame.SLDPRT"
Const FRAME_BACKUP As String = "C:\Users\kisha\Documents\Kiosk\KioskFrame_BACKUP.SLDPRT"

'====================================================================
' MAIN ENTRY POINT
'====================================================================
Sub ImproveDrumKioskFrame()
    '--- Connect to SolidWorks 2026 ---
    Set g_swApp = Application.SldWorks
    If g_swApp Is Nothing Then
        MsgBox "Cannot access SolidWorks 2026." & vbCrLf & _
               "Verify: Tools > References > SldWorks 2026 Type Library", _
               vbCritical, "Connection Error"
        Exit Sub
    End If

    '--- API version check (SW 2026 = revision 32+) ---
    Dim apiVer As String
    apiVer = g_swApp.RevisionNumber
    Debug.Print "SolidWorks API revision: " & apiVer

    '--- Open existing frame part ---
    Set g_swModel = OpenOrCreateFrame()
    If g_swModel Is Nothing Then
        MsgBox "Could not open or create the frame part.", vbCritical
        Exit Sub
    End If

    Set g_swPart = g_swModel
    Set g_swSkMgr = g_swModel.SketchManager
    Set g_swFeatMgr = g_swModel.FeatureManager
    Set g_swSelMgr = g_swModel.SelectionManager

    '--- Initialize global coordinates (meters) ---
    InitGlobals

    '--- Apply improvements in dependency order ---
    Dim t0 As Double
    t0 = Timer

    Debug.Print "=== Drum Kiosk Frame Improvement Macro ==="
    Debug.Print "Model: " & g_swModel.GetTitle

    AddBaseFootprintExtensions       ' (4) base stability
    AddRearShearStructure            ' (3) torsional rigidity
    AddCableManagementTabs           ' (7) cable routing
    AddNeckGussets                   ' (1) gussets at neck
    AddTopDrumSupportCrossMembers    ' (2) top frame reinforcement
    AddSecondaryHorizontalSupport    ' (2) secondary horizontal
    AddDrumMountingPlate             ' (5) drum mount plate
    AddVibrationIsolationBushings    ' (6) isolation mounts
    AddRearServiceOpeningFrame       ' (8) maintenance access
    AddAestheticTrimCaps             ' (10) aesthetic finish

    '--- Hide all construction planes for clean display ---
    HideAllReferencePlanes

    '--- Final rebuild and save ---
    g_swModel.ForceRebuild3 True
    SaveFramePart

    Debug.Print "=== All improvements applied in " & Format(Timer - t0, "0.00") & "s ==="
    MsgBox "Drum Kiosk Frame improvements applied successfully." & vbCrLf & _
           "Open the model in SolidWorks to inspect the new features." & _
           vbCrLf & vbCrLf & _
           "Check the Immediate Window (Ctrl+G) for feature log.", _
           vbInformation, "Frame Improvement Complete"
End Sub

'====================================================================
' UTILITY / INITIALIZATION
'====================================================================
Private Sub InitGlobals()
    g_xLeft  = m(-TW / 2)
    g_xRight = m(TW / 2)
    g_xCtr   = 0#
    g_zFront = m(TD / 2)
    g_zRear  = m(-TD / 2)
    g_zCtr   = 0#
    g_yBot    = 0#
    g_yMid    = m(TH / 2)
    g_yNeckBot = m(TH - NECK_H * 0.4)
    g_yNeckTop = m(TH + NECK_H * 0.6)
    g_yTop    = m(TH + NECK_H + 200)   ' top frame bottom = 200mm above neck top
End Sub

Private Function m(ByVal v As Double) As Double
    m = v * MM
End Function

Private Function OpenOrCreateFrame() As SldWorks.ModelDoc2
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")

    '--- 1. Try the active document ---
    Dim swDoc As SldWorks.ModelDoc2
    Set swDoc = g_swApp.ActiveDoc
    If Not swDoc Is Nothing Then
        If swDoc.GetType = swDocPART Then
            Debug.Print "Using active document: " & swDoc.GetTitle
            Set OpenOrCreateFrame = swDoc
            Exit Function
        End If
    End If

    '--- 2. Try opening the standard path ---
    If fso.FileExists(FRAME_PATH) Then
        Dim errs As Long
        Set swDoc = g_swApp.OpenDoc6(FRAME_PATH, swDocPART, swOpenDocOptions_Silent, "", errs, 1)
        If Not swDoc Is Nothing Then
            Debug.Print "Opened existing frame: " & FRAME_PATH
            Set OpenOrCreateFrame = swDoc
            Exit Function
        End If
    End If

    '--- 3. Nothing found ---
    MsgBox "No frame part found." & vbCrLf & vbCrLf & _
           "Please open your kiosk frame part (.SLDPRT) in SolidWorks" & vbCrLf & _
           "so it is the ACTIVE document, then re-run this macro.", _
           vbInformation, "Frame Not Found"
    Set OpenOrCreateFrame = Nothing
End Function

Private Sub SaveFramePart()
    Dim saveErrors As Long
    Dim saveWarnings As Long
    On Error Resume Next
    saveErrors = 0
    saveWarnings = 0
    g_swModel.Save3 swSaveAsOptions_e.swSaveAsOptions_Silent, _
                    saveErrors, saveWarnings
    If Err.Number <> 0 Then
        Debug.Print "Save3 failed: " & Err.Description
        Err.Clear
        g_swModel.Save
    End If
    On Error GoTo 0
    Debug.Print "Frame saved."
End Sub

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

'====================================================================
' FEATURE HELPERS - SW 2026 API compliant
'====================================================================

'--- Extrude: solid boss extrusion ---
' FeatureExtrusion3 with 23 parameters (SW 2026):
'   Sd, Flip, Dir, T1, T2, D1, D2,
'   Dchk1, Dchk2, Ddir1, Ddir2, Dang1, Dang2,
'   OffsetReverse1, OffsetReverse2, TranslateSurface1, TranslateSurface2,
'   Merge, UseFeatScope, UseAutoSelect,
'   AssemblyFeatureScope, AutoDetermineScope, AutoScopeInvert
Private Function Extrude(ByVal depthM As Double, _
                         Optional ByVal reverse As Boolean = False, _
                         Optional ByVal midPlane As Boolean = False) As Object
    Dim d1Type As Long
    If midPlane Then d1Type = 6 Else d1Type = 0   ' 6=MidPlane, 0=Blind
    Set Extrude = g_swFeatMgr.FeatureExtrusion3( _
        True, False, reverse, _
        d1Type, 0, _
        depthM, 0, _
        False, False, _
        False, False, _
        0, 0, _
        False, False, _
        False, False, _
        True, _
        True, True, _
        False, False, False)
End Function

'--- CutThru: through-all cut (T1=1 = swEndCondThroughAll) ---
' FeatureCut4 with 27 parameters (SW 2026):
'   Sd, Flip, Dir, T1, T2, D1, D2,
'   Dchk1, Dchk2, Ddir1, Ddir2, Dang1, Dang2,
'   OffsetReverse1, OffsetReverse2, TranslateSurface1, TranslateSurface2,
'   NormalCut, Merge, UseFeatScope, UseAutoSelect,
'   AssemblyFeatureScope, AutoDetermineScope, AutoScopeInvert,
'   SpecifyScope, AutoSelectInvert, BodyScopeList
Private Function CutThru() As Object
    Set CutThru = g_swFeatMgr.FeatureCut4( _
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
        False, False, False)
End Function

'--- CutBlind: blind-depth cut (T1=0 = swEndCondBlind) ---
Private Function CutBlind(ByVal depthM As Double, _
                          Optional ByVal reverse As Boolean = False) As Object
    Set CutBlind = g_swFeatMgr.FeatureCut4( _
        True, False, reverse, _
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
        False, False, False)
End Function

'--- MakePlane: create an offset reference plane ---
Private Function MakePlane(ByVal refPlane As String, _
                           ByVal distM As Double, _
                           ByVal newName As String) As String
    Dim pf As Object
    SelPlane refPlane
    ' 8 = swRefPlaneReferenceConstraint_Distance
    Set pf = g_swFeatMgr.InsertRefPlane(8, distM, 0, 0, 0, 0)
    If pf Is Nothing Then
        MakePlane = ""
        Exit Function
    End If
    pf.Name = newName
    MakePlane = newName
End Function

'--- HideAllReferencePlanes: suppress visual clutter after improvements ---
Private Sub HideAllReferencePlanes()
    On Error Resume Next
    Dim swFeat As SldWorks.Feature
    Set swFeat = g_swModel.FirstFeature
    Do While Not swFeat Is Nothing
        Dim fType As String
        fType = swFeat.GetTypeName2
        If fType = "ReferencePlane" Then
            swFeat.Visible = False
        End If
        Set swFeat = swFeat.GetNextFeature
    Loop
    On Error GoTo 0
End Sub

'====================================================================
' IMPROVEMENT 4 - EXTENDED BASE FOOTPRINT
'   Extends the base forward and rearward with cross members
'   to improve anti-tip resistance. Uses the existing 40x40x3 tube.
'====================================================================
Private Sub AddBaseFootprintExtensions()
    Debug.Print "--- 4. Extending base footprint ---"

    Dim fwdExt As Double, rearExt As Double
    fwdExt  = 220   ' mm forward of tower front
    rearExt = 180   ' mm rearward of tower rear

    '--- Forward extension (toward front face +Z) ---
    StartSketch "Top Plane"
    g_swSkMgr.CreateCornerRectangle _
        m(-TW / 2 - 20), m(TD / 2), 0, _
        m(TW / 2 + 20), m(TD / 2 + fwdExt), 0
    EndSketch
    Dim f As Object
    Set f = Extrude(m(FS))
    If Not f Is Nothing Then f.Name = "Base_ForwardExtension"
    Rebuild

    '--- Rearward extension (toward rear face -Z) ---
    StartSketch "Top Plane"
    g_swSkMgr.CreateCornerRectangle _
        m(-TW / 2 - 20), m(-TD / 2 - rearExt), 0, _
        m(TW / 2 + 20), m(-TD / 2), 0
    EndSketch
    Set f = Extrude(m(FS))
    If Not f Is Nothing Then f.Name = "Base_RearExtension"
    Rebuild

    '--- Cross members in the forward extension (3 tubes) ---
    Dim i As Integer
    Dim zPos As Double
    For i = 0 To 2
        zPos = TD / 2 + 20 + i * (fwdExt - 20) / 2
        StartSketch "Top Plane"
        g_swSkMgr.CreateLine m(-TW / 2 - 20), m(zPos), 0, m(TW / 2 + 20), m(zPos), 0
        EndSketch
        Set f = Extrude(m(FS2))
        If Not f Is Nothing Then f.Name = "Base_FwdCross_" & (i + 1)
        Rebuild
    Next i

    '--- Anti-tip counterweight tabs (rear, lower) ---
    StartSketch "Right Plane"
    g_swSkMgr.CreateCornerRectangle _
        m(-TD / 2 - rearExt + 10), m(FS), 0, _
        m(-TD / 2 - 10), m(FS + 25), 0
    EndSketch
    Set f = Extrude(m(TW + 40))
    If Not f Is Nothing Then f.Name = "Base_RearCounterweight"
    Rebuild

    Debug.Print "  Base footprint extended: +" & fwdExt & " fwd, +" & rearExt & " rear"
End Sub

'====================================================================
' IMPROVEMENT 3 - REAR SHEAR STRUCTURE
'   Hidden diagonal members on the rear face that prevent
'   left-right twisting of the tower. 25x25x3 tube.
'====================================================================
Private Sub AddRearShearStructure()
    Debug.Print "--- 3. Adding rear shear structure ---"

    '--- Diagonal 1: from lower-left rear to upper-right rear (in YZ plane) ---
    StartSketch "Right Plane"
    g_swSkMgr.CreateLine _
        m(-TD / 2 + FS), m(FS), 0, _
        m(TD / 2 - FS), m(TH - FS), 0
    EndSketch
    Dim f As Object
    Set f = Extrude(m(TW - 2 * FS))
    If Not f Is Nothing Then f.Name = "Rear_ShearDiagonal_1"
    Rebuild

    '--- Diagonal 2: from lower-right rear to upper-left rear ---
    StartSketch "Right Plane"
    g_swSkMgr.CreateLine _
        m(TD / 2 - FS), m(FS), 0, _
        m(-TD / 2 + FS), m(TH - FS), 0
    EndSketch
    Set f = Extrude(m(TW - 2 * FS))
    If Not f Is Nothing Then f.Name = "Rear_ShearDiagonal_2"
    Rebuild

    '--- Hidden K-brace in the middle third of the tower (rear) ---
    Dim yK1 As Double, yK2 As Double, yKMid As Double
    yK1 = m(TH * 0.3)
    yK2 = m(TH * 0.7)
    yKMid = m(TH * 0.5)

    StartSketch "Right Plane"
    g_swSkMgr.CreateLine m(-TD / 2 + FS), yK1, 0, m(0), yKMid, 0
    g_swSkMgr.CreateLine m(0), yKMid, 0, m(-TD / 2 + FS), yK2, 0
    EndSketch
    Set f = Extrude(m(TW - 2 * FS))
    If Not f Is Nothing Then f.Name = "Rear_KBrace"
    Rebuild

    '--- Symmetric shear on the FRONT face (also hidden behind display panel) ---
    StartSketch "Front Plane"
    g_swSkMgr.CreateLine _
        m(-TD / 2 + FS), m(FS), 0, _
        m(TD / 2 - FS), m(TH - FS), 0
    EndSketch
    Set f = Extrude(m(TW - 2 * FS))
    If Not f Is Nothing Then f.Name = "Front_ShearDiagonal_1"
    Rebuild

    StartSketch "Front Plane"
    g_swSkMgr.CreateLine _
        m(TD / 2 - FS), m(FS), 0, _
        m(-TD / 2 + FS), m(TH - FS), 0
    EndSketch
    Set f = Extrude(m(TW - 2 * FS))
    If Not f Is Nothing Then f.Name = "Front_ShearDiagonal_2"
    Rebuild

    Debug.Print "  Rear shear structure added: 2 diagonals + K-brace"
End Sub

'====================================================================
' IMPROVEMENT 7 - CABLE MANAGEMENT TABS
'   Mounting tabs along the inside of one vertical post that
'   guide the wiring harness from base to drum.
'   30x10mm bent tabs welded to the post.
'====================================================================
Private Sub AddCableManagementTabs()
    Debug.Print "--- 7. Adding cable management tabs ---"

    '--- Create plane for the tab pattern (interior of right rear post) ---
    Dim tabPlane As String
    tabPlane = MakePlane("Right Plane", m(-TW / 2 + FW + 2), "Plane_CableTabs")
    If tabPlane = "" Then
        Debug.Print "  WARN: Could not create tab plane, using Right Plane"
        tabPlane = "Right Plane"
    End If

    '--- 5 cable tabs, spaced 280mm vertically, from y=200 to y=1320 ---
    Dim i As Integer
    Dim yTab As Double
    Dim f As Object
    For i = 0 To 4
        yTab = 200 + i * 280   ' mm
        StartSketch tabPlane
        ' Tab outline: 24mm wide (along Z), 25mm deep (along X)
        g_swSkMgr.CreateCornerRectangle _
            m(FS / 2 - 12), m(yTab - 2), 0, _
            m(FS / 2 + 12), m(yTab + 2), 0
        EndSketch
        Set f = Extrude(m(15))
        If Not f Is Nothing Then f.Name = "CableTab_" & (i + 1)
        Rebuild

        '--- Slot in each tab for cable tie ---
        StartSketch tabPlane
        g_swSkMgr.CreateCornerRectangle _
            m(FS / 2 - 10), m(yTab - 1), 0, _
            m(FS / 2 + 10), m(yTab + 1), 0
        EndSketch
        Set f = CutThru()
        If Not f Is Nothing Then f.Name = "CableTab_Slot_" & (i + 1)
        Rebuild
    Next i

    '--- Cable entry bushing hole at base (rear) ---
    Dim basePlane As String
    basePlane = MakePlane("Right Plane", m(-TW / 2 + FS), "Plane_CableEntry")
    StartSketch basePlane
    g_swSkMgr.CreateCircle m(TD / 2 - 30), m(80), 0, m(TD / 2 - 22), m(80), 0
    EndSketch
    Set f = CutThru()
    If Not f Is Nothing Then f.Name = "Cable_EntryHole"
    Rebuild

    '--- Internal cable path tube (25mm dia conduit through tower) ---
    StartSketch "Top Plane"
    g_swSkMgr.CreateCircle m(-TW / 2 + 80), m(TD / 2 - 25), 0, _
                           m(-TW / 2 + 80), m(TD / 2 - 15), 0
    EndSketch
    Set f = Extrude(m(TH - 100))
    If Not f Is Nothing Then f.Name = "InternalCableConduit"
    Rebuild

    '--- Exit hole at top of conduit (just below drum mount) ---
    StartSketch "Top Plane"
    g_swSkMgr.CreateCircle m(-TW / 2 + 80), m(TD / 2 - 25), 0, _
                           m(-TW / 2 + 80), m(TD / 2 - 15), 0
    EndSketch
    Set f = CutThru()
    If Not f Is Nothing Then f.Name = "Cable_ExitHole"
    Rebuild

    Debug.Print "  Cable management: 5 tabs + entry hole + conduit added"
End Sub

'====================================================================
' IMPROVEMENT 1 - TRIANGULAR GUSSETS AT NECK TRANSITION
'   6mm thick triangular gusset plates on BOTH sides (left/right)
'   of the angled neck. Fully welded (modeled as bonded).
'====================================================================
Private Sub AddNeckGussets()
    Debug.Print "--- 1. Adding neck transition gussets (6mm) ---"

    '--- Calculate neck geometry ---
    Dim neckBaseY As Double, neckTopY As Double
    Dim neckBaseZ As Double, neckTopZ As Double
    Dim gussetT As Double

    neckBaseY = TH                         ' bottom of angled section (tower top)
    neckTopY  = TH + NECK_H               ' top of angled section
    neckBaseZ = TD / 2                     ' front face of tower
    neckTopZ  = TD / 2 - (NECK_TOP_D / 2) ' recede to top frame
    gussetT   = 6                          ' mm gusset thickness

    '--- LEFT side gusset (in plane x = -TW/2) ---
    ' Triangle vertices (in YZ at x=-TW/2):
    '   A: tower-top-front          (TD/2, TH)
    '   B: tower-top-back (inner)   (-TD/2 + FS, TH)
    '   C: neck-top-front           (neckTopZ, neckTopY)
    Dim planeGussetL As String
    planeGussetL = MakePlane("Top Plane", m(FS), "Plane_GussetLeft")
    If planeGussetL = "" Then planeGussetL = "Top Plane"

    StartSketch planeGussetL
    ' Triangle in YZ: x-axis of sketch is Y, y-axis of sketch is Z
    g_swSkMgr.CreateLine m(0), m(neckBaseZ), 0, m(neckBaseY), m(neckBaseZ - FS), 0
    g_swSkMgr.CreateLine m(neckBaseY), m(neckBaseZ - FS), 0, m(neckTopY), m(neckTopZ), 0
    g_swSkMgr.CreateLine m(neckTopY), m(neckTopZ), 0, m(0), m(neckBaseZ), 0
    EndSketch
    Dim f As Object
    ' Extrude in -X direction (to the left side of the frame), 6mm thick
    Set f = Extrude(m(gussetT), True)  ' reverse = true -> -X
    If Not f Is Nothing Then f.Name = "Gusset_Left"

    '--- RIGHT side gusset (symmetric, at x = +TW/2) ---
    Dim planeGussetR As String
    planeGussetR = MakePlane("Top Plane", m(TW - FS), "Plane_GussetRight")
    If planeGussetR = "" Then planeGussetR = "Top Plane"

    StartSketch planeGussetR
    g_swSkMgr.CreateLine m(0), m(neckBaseZ), 0, m(neckBaseY), m(neckBaseZ - FS), 0
    g_swSkMgr.CreateLine m(neckBaseY), m(neckBaseZ - FS), 0, m(neckTopY), m(neckTopZ), 0
    g_swSkMgr.CreateLine m(neckTopY), m(neckTopZ), 0, m(0), m(neckBaseZ), 0
    EndSketch
    Set f = Extrude(m(gussetT))  ' forward = +X
    If Not f Is Nothing Then f.Name = "Gusset_Right"
    Rebuild

    '--- Secondary lower gusset (smaller, reinforces the bend) ---
    Dim planeGussetL2 As String
    planeGussetL2 = MakePlane("Top Plane", m(FS), "Plane_GussetLeft2")
    If planeGussetL2 = "" Then planeGussetL2 = "Top Plane"

    StartSketch planeGussetL2
    Dim midY As Double, midZ As Double
    midY = TH + NECK_H * 0.4
    midZ = TD / 2 - (NECK_TOP_D / 2) * 0.4
    g_swSkMgr.CreateLine m(0), m(neckBaseZ - FS), 0, m(neckBaseY + 40), m(neckBaseZ - FS), 0
    g_swSkMgr.CreateLine m(neckBaseY + 40), m(neckBaseZ - FS), 0, m(midY), m(midZ), 0
    g_swSkMgr.CreateLine m(midY), m(midZ), 0, m(0), m(neckBaseZ - FS), 0
    EndSketch
    Set f = Extrude(m(gussetT), True)
    If Not f Is Nothing Then f.Name = "Gusset_Left_2"

    Dim planeGussetR2 As String
    planeGussetR2 = MakePlane("Top Plane", m(TW - FS), "Plane_GussetRight2")
    If planeGussetR2 = "" Then planeGussetR2 = "Top Plane"

    StartSketch planeGussetR2
    g_swSkMgr.CreateLine m(0), m(neckBaseZ - FS), 0, m(neckBaseY + 40), m(neckBaseZ - FS), 0
    g_swSkMgr.CreateLine m(neckBaseY + 40), m(neckBaseZ - FS), 0, m(midY), m(midZ), 0
    g_swSkMgr.CreateLine m(midY), m(midZ), 0, m(0), m(neckBaseZ - FS), 0
    EndSketch
    Set f = Extrude(m(gussetT))
    If Not f Is Nothing Then f.Name = "Gusset_Right_2"
    Rebuild

    Debug.Print "  Gussets added: left+right primary, left+right secondary"
End Sub

'====================================================================
' IMPROVEMENT 2a - TOP DRUM SUPPORT CROSS MEMBERS
'   Internal cross members inside the top frame to make a
'   rigid drum mounting platform.
'====================================================================
Private Sub AddTopDrumSupportCrossMembers()
    Debug.Print "--- 2a. Adding top drum support cross members ---"

    Dim topFrameY As Double      ' vertical position of top frame
    Dim topFrameH As Double      ' height of top frame box
    Dim topFrameW As Double      ' width of top frame
    Dim topFrameD As Double      ' depth of top frame

    topFrameY = TH + NECK_H + 100     ' 100mm above neck top
    topFrameH = 200
    topFrameW = NECK_TOP_W
    topFrameD = NECK_TOP_D

    '--- Create a plane at the bottom of the top frame ---
    Dim pTop As String
    pTop = MakePlane("Right Plane", m(topFrameY), "Plane_TopFrameBot")

    '--- Two cross members along Z (perpendicular to neck direction) ---
    Dim i As Integer
    Dim xPos As Double
    Dim f As Object
    For i = 0 To 1
        xPos = -topFrameW / 2 + FS + i * (topFrameW - 2 * FS)
        StartSketch pTop
        g_swSkMgr.CreateLine m(xPos), m(-topFrameD / 2 + FS), 0, _
                             m(xPos), m(topFrameD / 2 - FS), 0
        EndSketch
        Set f = Extrude(m(FS3))
        If Not f Is Nothing Then f.Name = "TopFrame_Cross_Z_" & (i + 1)
        Rebuild
    Next i

    '--- One cross member along X (perpendicular, 90 degrees) ---
    StartSketch pTop
    g_swSkMgr.CreateLine m(-topFrameW / 2 + FS), m(0), 0, _
                         m(topFrameW / 2 - FS), m(0), 0
    EndSketch
    Set f = Extrude(m(FS3))
    If Not f Is Nothing Then f.Name = "TopFrame_Cross_X_1"
    Rebuild

    '--- Diagonal braces in the top frame (X-pattern) ---
    StartSketch pTop
    g_swSkMgr.CreateLine m(-topFrameW / 2 + FS), m(-topFrameD / 2 + FS), 0, _
                         m(topFrameW / 2 - FS), m(topFrameD / 2 - FS), 0
    EndSketch
    Set f = Extrude(m(FS3))
    If Not f Is Nothing Then f.Name = "TopFrame_Diag_1"
    Rebuild

    StartSketch pTop
    g_swSkMgr.CreateLine m(topFrameW / 2 - FS), m(-topFrameD / 2 + FS), 0, _
                         m(-topFrameW / 2 + FS), m(topFrameD / 2 - FS), 0
    EndSketch
    Set f = Extrude(m(FS3))
    If Not f Is Nothing Then f.Name = "TopFrame_Diag_2"
    Rebuild

    Debug.Print "  Top drum support: 3 cross members + X-brace"
End Sub

'====================================================================
' IMPROVEMENT 2b - SECONDARY HORIZONTAL SUPPORT
'   Horizontal support beam below the drum frame to carry
'   the drum weight back into the tower's vertical posts.
'====================================================================
Private Sub AddSecondaryHorizontalSupport()
    Debug.Print "--- 2b. Adding secondary horizontal support ---"

    Dim beamY As Double
    beamY = TH + 80  ' 80mm below the top of the tower

    '--- The secondary beam: a 40x40 tube running across the top of the tower ---
    ' Sketch on Right Plane (YZ), extrude along X
    StartSketch "Right Plane"
    g_swSkMgr.CreateLine m(0), m(beamY), 0, m(TD - 2 * FS), m(beamY), 0
    EndSketch
    Dim f As Object
    Set f = Extrude(m(TW - 2 * FS))
    If Not f Is Nothing Then f.Name = "SecondaryBeam_Rear"
    Rebuild

    StartSketch "Right Plane"
    g_swSkMgr.CreateLine m(0), m(beamY), 0, m(TD - 2 * FS), m(beamY), 0
    EndSketch
    Set f = Extrude(m(-(TW - 2 * FS)))
    If Not f Is Nothing Then f.Name = "SecondaryBeam_Front"
    Rebuild

    '--- Diagonal web stiffeners between secondary beam and top cap ---
    Dim i As Integer
    Dim xStiff As Double
    For i = 0 To 1
        xStiff = -TW / 2 + FS + 60 + i * (TW - 2 * FS - 120)
        StartSketch "Front Plane"
        g_swSkMgr.CreateLine m(xStiff), m(TH - 50), 0, m(xStiff + 40), m(beamY + 30), 0
        EndSketch
        Set f = Extrude(m(FS2))
        If Not f Is Nothing Then f.Name = "Stiffener_Front_" & (i + 1)
        Rebuild

        StartSketch "Front Plane"
        g_swSkMgr.CreateLine m(xStiff), m(TH - 50), 0, m(xStiff + 40), m(beamY + 30), 0
        EndSketch
        Set f = Extrude(m(-FS2))
        If Not f Is Nothing Then f.Name = "Stiffener_Rear_" & (i + 1)
        Rebuild
    Next i

    Debug.Print "  Secondary horizontal support added: 2 beams + 4 stiffeners"
End Sub

'====================================================================
' IMPROVEMENT 5 - DRUM MOUNTING PLATE
'   10mm steel plate on top of the drum frame with a centered
'   mounting hole pattern. Bolted (not welded) so the drum can
'   be removed without cutting.
'====================================================================
Private Sub AddDrumMountingPlate()
    Debug.Print "--- 5. Adding 10mm drum mounting plate ---"

    Dim plateY As Double
    plateY = TH + NECK_H + 320   ' 20mm above top frame top

    '--- Plate plane (offset from Top Plane) ---
    Dim pPlate As String
    pPlate = MakePlane("Top Plane", m(plateY), "Plane_DrumPlate")

    '--- Plate outline (300 x 300 mm centered) ---
    Dim plateHalf As Double
    plateHalf = 150
    StartSketch pPlate
    g_swSkMgr.CreateCornerRectangle _
        m(-plateHalf), m(-plateHalf), 0, _
        m(plateHalf), m(plateHalf), 0
    EndSketch
    Dim f As Object
    Set f = Extrude(m(10))  ' 10mm thick
    If Not f Is Nothing Then f.Name = "DrumMountingPlate"
    Rebuild

    '--- Corner mounting holes (4x M10 clearance for drum bolts) ---
    Dim holeInset As Double
    holeInset = 25
    Dim cornerR As Double
    cornerR = 5.5  ' M10 = 10mm dia, +1mm clearance
    Dim px As Double, py As Double
    Dim signs As Variant
    signs = Array(-1, -1, 1, -1, 1, 1, -1, 1)  ' (sx,sy) pairs
    Dim ci As Integer
    For ci = 0 To 3
        px = signs(ci * 2) * (plateHalf - holeInset)
        py = signs(ci * 2 + 1) * (plateHalf - holeInset)
        StartSketch pPlate
        g_swSkMgr.CreateCircle m(px), m(py), 0, m(px + cornerR * MM), m(py), 0
        EndSketch
        Set f = CutThru()
        If Not f Is Nothing Then f.Name = "DrumPlate_CornerHole_" & (ci + 1)
        Rebuild
    Next ci

    '--- Center hole pattern for drum center stud (M12) ---
    StartSketch pPlate
    g_swSkMgr.CreateCircle 0, 0, 0, m(6.5), 0, 0   ' M12 = 12mm dia + 1mm
    EndSketch
    Set f = CutThru()
    If Not f Is Nothing Then f.Name = "DrumPlate_CenterHole"
    Rebuild

    '--- Decorative chamfered edge (Apple/Tesla style) ---
    StartSketch pPlate
    g_swSkMgr.CreateCornerRectangle _
        m(-plateHalf + 8), m(-plateHalf + 8), 0, _
        m(plateHalf - 8), m(plateHalf - 8), 0
    EndSketch
    Set f = CutBlind(m(1.5))
    If Not f Is Nothing Then f.Name = "DrumPlate_InnerRecess"
    Rebuild

    Debug.Print "  Drum mounting plate: 300x300x10mm, 4 corner M10 + 1 center M12"
End Sub

'====================================================================
' IMPROVEMENT 6 - VIBRATION ISOLATION BUSHINGS
'   Mounting tabs for 4 rubber isolation bushings.
'   The bushings sit between the drum plate and the top frame,
'   aligned with the drum centerline.
'====================================================================
Private Sub AddVibrationIsolationBushings()
    Debug.Print "--- 6. Adding vibration isolation provisions ---"

    Dim plateY As Double
    plateY = TH + NECK_H + 320

    '--- Create 4 mounting tab bodies on the underside of the drum plate ---
    Dim tabPlane As String
    tabPlane = MakePlane("Top Plane", m(plateY - 10), "Plane_BushingTabs")
    If tabPlane = "" Then tabPlane = "Top Plane"

    Dim px As Double, py As Double
    Dim signs As Variant
    signs = Array(-1, -1, 1, -1, 1, 1, -1, 1)
    Dim ci As Integer
    Dim f As Object
    For ci = 0 To 3
        px = signs(ci * 2) * 125
        py = signs(ci * 2 + 1) * 125
        ' Cylindrical boss (20mm dia, 15mm tall)
        StartSketch tabPlane
        g_swSkMgr.CreateCircle m(px), m(py), 0, m(px + m(10)), m(py), 0
        EndSketch
        Set f = Extrude(m(-15))   ' extend downward
        If Not f Is Nothing Then f.Name = "Bushing_Tab_" & (ci + 1)
        Rebuild

        ' Center hole for M10 bushing stud
        StartSketch tabPlane
        g_swSkMgr.CreateCircle m(px), m(py), 0, m(px + m(5)), m(py), 0
        EndSketch
        Set f = CutThru()
        If Not f Is Nothing Then f.Name = "Bushing_Hole_" & (ci + 1)
        Rebuild
    Next ci

    '--- Spacer rings (visual representation of the rubber bushing zone) ---
    Dim ringPlane As String
    ringPlane = MakePlane("Top Plane", m(plateY - 25), "Plane_BushingRings")
    If ringPlane = "" Then ringPlane = "Top Plane"

    For ci = 0 To 3
        px = signs(ci * 2) * 125
        py = signs(ci * 2 + 1) * 125
        StartSketch ringPlane
        ' Ring (outer dia 30, inner dia 10)
        g_swSkMgr.CreateCircle m(px), m(py), 0, m(px + m(15)), m(py), 0
        g_swSkMgr.CreateCircle m(px), m(py), 0, m(px + m(5)), m(py), 0
        EndSketch
        Set f = Extrude(m(-20))
        If Not f Is Nothing Then f.Name = "Bushing_Spacer_" & (ci + 1)
        Rebuild
    Next ci

    Debug.Print "  Vibration isolation: 4 tabs + spacers aligned with drum centerline"
End Sub

'====================================================================
' IMPROVEMENT 8 - REAR SERVICE OPENING FRAME
'   Framed opening on the rear panel for service access.
'   The frame provides a mount for a removable service panel.
'====================================================================
Private Sub AddRearServiceOpeningFrame()
    Debug.Print "--- 8. Adding rear service opening frame ---"

    '--- Service opening dimensions ---
    Dim openW As Double, openH As Double
    Dim openY As Double
    openW = 320    ' mm wide
    openH = 380    ' mm tall
    openY = TH / 2 ' centered vertically on the tower

    '--- Create a plane on the rear face ---
    Dim pRear As String
    pRear = MakePlane("Front Plane", m(-TD / 2 + FS / 2), "Plane_RearService")
    If pRear = "" Then pRear = "Front Plane"

    '--- Cut the opening (this is the hole in the rear panel) ---
    StartSketch pRear
    g_swSkMgr.CreateCornerRectangle _
        m(-openW / 2), m(openY - openH / 2), 0, _
        m(openW / 2), m(openY + openH / 2), 0
    EndSketch
    Dim f As Object
    Set f = CutThru()
    If Not f Is Nothing Then f.Name = "Rear_ServiceOpening"
    Rebuild

    '--- Inner frame around the opening (4 thin tubes) ---
    Dim frameT As Double
    frameT = 20  ' tube outer size
    Dim halfW As Double, halfH As Double
    halfW = openW / 2
    halfH = openH / 2

    ' Top horizontal
    StartSketch pRear
    g_swSkMgr.CreateLine m(-halfW), m(openY + halfH), 0, m(halfW), m(openY + halfH), 0
    EndSketch
    Set f = Extrude(m(-frameT))  ' protrude outward (-X for rear)
    If Not f Is Nothing Then f.Name = "ServiceFrame_Top"
    Rebuild

    ' Bottom horizontal
    StartSketch pRear
    g_swSkMgr.CreateLine m(-halfW), m(openY - halfH), 0, m(halfW), m(openY - halfH), 0
    EndSketch
    Set f = Extrude(m(-frameT))
    If Not f Is Nothing Then f.Name = "ServiceFrame_Bottom"
    Rebuild

    ' Left vertical
    StartSketch pRear
    g_swSkMgr.CreateLine m(-halfW), m(openY - halfH), 0, m(-halfW), m(openY + halfH), 0
    EndSketch
    Set f = Extrude(m(-frameT))
    If Not f Is Nothing Then f.Name = "ServiceFrame_Left"
    Rebuild

    ' Right vertical
    StartSketch pRear
    g_swSkMgr.CreateLine m(halfW), m(openY - halfH), 0, m(halfW), m(openY + halfH), 0
    EndSketch
    Set f = Extrude(m(-frameT))
    If Not f Is Nothing Then f.Name = "ServiceFrame_Right"
    Rebuild

    '--- M5 captive nut holes for the service panel screws (8 holes, 4 per side) ---
    Dim capInset As Double
    capInset = 12
    Dim capSp As Double
    capSp = (openH - 2 * capInset) / 3

    Dim i As Integer
    Dim yHole As Double
    For i = 0 To 3
        yHole = openY - halfH + capInset + i * capSp
        ' Left side hole
        StartSketch pRear
        g_swSkMgr.CreateCircle m(-halfW - 5), m(yHole), 0, _
                               m(-halfW - 5 + m(2.5)), m(yHole), 0
        EndSketch
        Set f = CutThru()
        If Not f Is Nothing Then f.Name = "ServiceScrewHole_L_" & (i + 1)
        Rebuild

        ' Right side hole
        StartSketch pRear
        g_swSkMgr.CreateCircle m(halfW + 5), m(yHole), 0, _
                               m(halfW + 5 + m(2.5)), m(yHole), 0
        EndSketch
        Set f = CutThru()
        If Not f Is Nothing Then f.Name = "ServiceScrewHole_R_" & (i + 1)
        Rebuild
    Next i

    '--- Service panel handle mount (centered, lower) ---
    StartSketch pRear
    g_swSkMgr.CreateCornerRectangle _
        m(-40), m(openY - halfH - 20), 0, _
        m(40), m(openY - halfH - 10), 0
    EndSketch
    Set f = Extrude(m(-2))
    If Not f Is Nothing Then f.Name = "ServiceHandle_Mount"
    Rebuild

    Debug.Print "  Rear service opening: frame + 8 screw holes + handle mount"
End Sub

'====================================================================
' IMPROVEMENT 10 - AESTHETIC TRIM CAPS
'   Apple/Tesla-style trim: clean end caps on the top of all
'   vertical tubes and the open ends of the base extensions.
'   These hide the structural complexity and provide a finished
'   industrial look.
'====================================================================
Private Sub AddAestheticTrimCaps()
    Debug.Print "--- 10. Adding aesthetic trim caps ---"

    '--- Top caps on the 4 corner posts ---
    Dim capH As Double
    capH = 3  ' mm
    Dim capS As Double
    capS = FS + 1  ' slightly larger than the tube for snap-fit visual

    ' Cap plane at top of each post
    Dim postTops As Variant
    postTops = Array( _
        Array("Plane_Cap_FL", m(-TW / 2 + FS / 2), m(TD / 2 - FS / 2), m(TH + 1)), _
        Array("Plane_Cap_FR", m(TW / 2 - FS / 2), m(TD / 2 - FS / 2), m(TH + 1)), _
        Array("Plane_Cap_RL", m(-TW / 2 + FS / 2), m(-TD / 2 + FS / 2), m(TH + 1)), _
        Array("Plane_Cap_RR", m(TW / 2 - FS / 2), m(-TD / 2 + FS / 2), m(TH + 1)) _
    )

    Dim pName As String
    Dim f As Object
    Dim p As Variant
    For Each p In postTops
        pName = MakePlane("Top Plane", p(3), p(0))
        If pName = "" Then pName = "Top Plane"

        StartSketch pName
        g_swSkMgr.CreateCornerRectangle _
            p(1) - m(capS / 2), p(2) - m(capS / 2), 0, _
            p(1) + m(capS / 2), p(2) + m(capS / 2), 0
        EndSketch
        Set f = Extrude(m(capH))
        If Not f Is Nothing Then f.Name = "TrimCap_" & Mid(p(0), 12)
        Rebuild
    Next p

    '--- Round the bottom-front edge of the base extension (Apple-style radius) ---
    Dim radCyl As Double
    radCyl = 15
    Dim radPlane As String
    radPlane = MakePlane("Right Plane", m(-TW / 2 + FS / 2 + TD / 2 + 110), "Plane_BaseRadius")
    If radPlane = "" Then radPlane = "Top Plane"

    StartSketch radPlane
    g_swSkMgr.CreateCircle m(-TD / 2 - 110), m(FS / 2), 0, _
                           m(-TD / 2 - 110 + m(radCyl)), m(FS / 2), 0
    EndSketch
    Set f = CutThru()
    If Not f Is Nothing Then f.Name = "BaseRadiusCorner_L"
    Rebuild

    StartSketch radPlane
    g_swSkMgr.CreateCircle m(TD / 2 + 110), m(FS / 2), 0, _
                           m(TD / 2 + 110 + m(radCyl)), m(FS / 2), 0
    EndSketch
    Set f = CutThru()
    If Not f Is Nothing Then f.Name = "BaseRadiusCorner_R"
    Rebuild

    '--- Logo / model number plate (recessed area on the lower rear) ---
    Dim pLogo As String
    pLogo = MakePlane("Front Plane", m(-TD / 2 + FS / 2), "Plane_Logo")
    If pLogo = "" Then pLogo = "Front Plane"

    StartSketch pLogo
    g_swSkMgr.CreateCornerRectangle _
        m(TW / 2 - 90), m(80), 0, _
        m(TW / 2 - 20), m(110), 0
    EndSketch
    Set f = CutBlind(m(0.5))
    If Not f Is Nothing Then f.Name = "Logo_Recess"
    Rebuild

    Debug.Print "  Aesthetic trim: 4 post caps + 2 base radii + logo recess"
End Sub

'====================================================================
' END OF MACRO
'====================================================================
